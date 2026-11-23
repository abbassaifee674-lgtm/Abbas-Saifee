import { GoogleGenerativeAI } from "@google/generative-ai";
import { AICompletionOptions, AIProvider } from "./provider";

// Queue to enforce rate limit pacing (< 14 requests per minute to stay safe on 15 RPM free tier)
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

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: GoogleGenerativeAI | null = null;
  private primaryModel: string;
  private fallbackModel: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    this.primaryModel = process.env.AI_MODEL || "gemini-2.0-flash";
    this.fallbackModel = this.primaryModel === "gemini-2.0-flash" ? "gemini-1.5-flash" : "gemini-2.0-flash";
  }

  private getModel(modelName: string, systemInstruction?: string, jsonMode?: boolean) {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    return this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        responseMimeType: jsonMode ? "application/json" : "text/plain",
      },
    });
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in .env.local.");
    }

    return geminiQueue.enqueue(() => this.executeWithRetry(prompt, systemInstruction, options));
  }

  private async executeWithRetry(
    prompt: string,
    systemInstruction?: string,
    options?: AICompletionOptions,
    attempt = 1,
    modelName = this.primaryModel
  ): Promise<string> {
    try {
      const model = this.getModel(modelName, systemInstruction, options?.jsonMode);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("RESOURCE_EXHAUSTED") ||
        err.message?.includes("quota");

      // Retry with backoff if rate limited and within 3 attempts
      if (isRateLimit && attempt <= 3) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[Gemini Rate Limit] Attempt ${attempt} hit 429 on ${modelName}. Retrying in ${delay.toFixed(0)}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        return this.executeWithRetry(prompt, systemInstruction, options, attempt + 1, modelName);
      }

      // If primary model failed on not found or persistent error, try fallback model
      if (modelName !== this.fallbackModel) {
        console.warn(`[Gemini Fallback] Switching from ${modelName} to ${this.fallbackModel}:`, err.message);
        return this.executeWithRetry(prompt, systemInstruction, options, 1, this.fallbackModel);
      }

      throw err;
    }
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
