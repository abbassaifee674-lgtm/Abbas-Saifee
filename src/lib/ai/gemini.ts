import { GoogleGenAI } from "@google/genai";
import { AICompletionOptions, AIProvider } from "./provider";

// Queue to enforce rate limit pacing (< 14 requests per minute to stay safe on free tier)
class RequestQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;
  private minIntervalMs = 2500; // minimum 2.5 seconds between requests

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

// Candidate models to try in priority order (avoid deprecated gemini-1.5-flash)
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private models: string[];
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const preferredModel = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";
    // Deduplicate models while keeping preferredModel at index 0
    this.models = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]));
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in .env.local.");
    }

    return geminiQueue.enqueue(() => this.executeWithFallback(prompt, systemInstruction, options));
  }

  private async executeWithFallback(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    let lastError: any = null;

    for (const model of this.models) {
      try {
        return await this.callWithRetry(model, prompt, systemInstruction, options);
      } catch (err: any) {
        lastError = err;
        const msg = err.message || "";
        const isNotFoundOrDeprecated =
          err.status === 404 ||
          msg.includes("404") ||
          msg.includes("not found") ||
          msg.includes("unsupported") ||
          msg.includes("deprecated");

        if (isNotFoundOrDeprecated) {
          console.warn(`[Gemini Fallback] Model ${model} unavailable (${msg}). Trying next candidate model...`);
          continue;
        }

        // If it's another error (like auth or bad request), try the direct REST endpoint before moving to next model
        try {
          return await this.callDirectRest(model, prompt, systemInstruction, options);
        } catch (restErr: any) {
          lastError = restErr;
          console.warn(`[Gemini Direct REST Fallback] Model ${model} failed on direct REST:`, restErr.message);
        }
      }
    }

    throw lastError || new Error("All configured Gemini models failed.");
  }

  private async callWithRetry(
    model: string,
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions,
    attempt = 1
  ): Promise<string> {
    try {
      if (!this.ai) {
        throw new Error("GoogleGenAI client not initialized.");
      }

      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (options?.jsonMode) config.responseMimeType = "application/json";
      if (options?.temperature !== undefined) config.temperature = options.temperature;
      if (options?.maxTokens !== undefined) config.maxOutputTokens = options.maxTokens;

      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;
      if (!text) {
        throw new Error("No text returned in Gemini response.");
      }
      return text;
    } catch (err: any) {
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("RESOURCE_EXHAUSTED") ||
        err.message?.includes("quota");

      if (isRateLimit && attempt <= 3) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[Gemini Rate Limit] Attempt ${attempt} hit 429 on ${model}. Retrying in ${delay.toFixed(0)}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        return this.callWithRetry(model, prompt, systemInstruction, options, attempt + 1);
      }

      throw err;
    }
  }

  /**
   * Direct REST fallback: calls generativelanguage.googleapis.com directly
   * sending the key strictly in the "x-goog-api-key" header (never ?key= query parameter)
   */
  private async callDirectRest(
    model: string,
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const body: any = {
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

    const generationConfig: any = {};
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
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error?.message || `HTTP ${res.status} from Gemini REST API`;
      const reason = data?.error?.details?.[0]?.reason || "";
      const fullError = reason ? `${errorMsg} (${reason})` : errorMsg;
      throw new Error(fullError);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty candidate parts returned from Gemini API");
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
      throw new Error(`Invalid JSON format from Gemini: ${parseError}`);
    }
  }
}
