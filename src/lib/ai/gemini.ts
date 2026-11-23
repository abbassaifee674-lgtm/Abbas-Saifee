import { AICompletionOptions, AIProvider } from "./provider";

// Rate limit queue (< 14 requests per minute to stay safe on free tier: min 2.5s interval)
class RequestQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private minIntervalMs = 2500;

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const nextTask = this.queue.shift();
    if (nextTask) {
      await nextTask();
      await new Promise((r) => setTimeout(r, this.minIntervalMs));
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      this.processNext();
    }
  }
}

const geminiQueue = new RequestQueue();

// Model cascade: tries configured GEMINI_MODEL first (default gemini-2.5-flash),
// then falls back across modern free flash models if one returns 404 or is unavailable.
// Note: gemini-1.5-flash is deprecated and excluded.
const DEFAULT_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private models: string[];

  constructor() {
    // Accept any non-empty key (no regex or format validation for "AIza")
    this.apiKey = (process.env.GEMINI_API_KEY || "").trim();

    const preferredModel = (process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash").trim();
    // Keep preferred model at index 0 without duplicates
    this.models = Array.from(new Set([preferredModel, ...DEFAULT_FALLBACK_MODELS]));
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    return geminiQueue.enqueue(() => this.executeWithModelFallback(prompt, systemInstruction, options));
  }

  private async executeWithModelFallback(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    let lastError: any = null;

    for (const model of this.models) {
      try {
        return await this.callRestWithRetry(model, prompt, systemInstruction, options);
      } catch (err: any) {
        lastError = err;
        const msg = (err.message || "").toLowerCase();
        const isUnavailableOrNotFound =
          err.status === 404 ||
          msg.includes("404") ||
          msg.includes("not found") ||
          msg.includes("unsupported") ||
          msg.includes("deprecated") ||
          msg.includes("is not found for api version");

        if (isUnavailableOrNotFound) {
          console.warn(`[Gemini Fallback] Model '${model}' unavailable: ${err.message}. Trying next candidate model...`);
          continue;
        }

        // If it's another non-fallback error (e.g. auth 401 or bad request), don't silently skip
        // but try the next model if available just in case model name permissions differ
        console.warn(`[Gemini Error] Model '${model}' request failed: ${err.message}`);
      }
    }

    throw lastError || new Error("All configured Gemini models failed to respond.");
  }

  /**
   * Direct REST call to https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   * Sends the key in the "x-goog-api-key" HTTP header (never as a ?key= query parameter).
   * Supports exponential backoff retry on 429 rate limits.
   */
  private async callRestWithRetry(
    model: string,
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions,
    attempt = 1
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const body: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const generationConfig: Record<string, any> = {};
    if (options?.jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }
    if (options?.temperature !== undefined) {
      generationConfig.temperature = options.temperature;
    }
    if (options?.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = options.maxTokens;
    }
    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey, // Strictly in header, never as ?key= query param
      },
      body: JSON.stringify(body),
    });

    // Handle 429 rate limit with exponential backoff
    if (res.status === 429 && attempt <= 3) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(`[Gemini Rate Limit] 429 on model ${model} (attempt ${attempt}). Retrying in ${delay.toFixed(0)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return this.callRestWithRetry(model, prompt, systemInstruction, options, attempt + 1);
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorObj = data?.error;
      const message = errorObj?.message || `HTTP ${res.status} from Gemini REST API`;
      const reason = errorObj?.details?.[0]?.reason || "";
      const errorMsg = reason ? `${message} (${reason})` : message;
      const error = new Error(errorMsg) as any;
      error.status = res.status;
      error.details = errorObj;
      throw error;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new Error(`Empty or invalid candidate content received from Gemini model '${model}'`);
    }

    return text;
  }

  async generateJSON<T>(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<T> {
    const text = await this.generateText(prompt, systemInstruction, {
      ...options,
      jsonMode: true,
    });
    try {
      const cleaned = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", text);
      throw new Error(`Invalid JSON format returned by Gemini: ${parseError}`);
    }
  }
}
