import { GoogleGenerativeAI } from "@google/generative-ai";
import { AICompletionOptions, AIProvider } from "./provider";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    // Default to free flash model
    this.modelName = process.env.AI_MODEL || "gemini-2.0-flash";
  }

  private getModel(systemInstruction?: string, jsonMode?: boolean) {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }

    return this.client.getGenerativeModel({
      model: this.modelName,
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
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing - falling back to simulated AI response");
      return "AI response simulated (configure GEMINI_API_KEY for live generation).";
    }

    try {
      const model = this.getModel(systemInstruction, options?.jsonMode);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error("Gemini API generation error:", err);
      // Fallback try with 1.5-flash if 2.0-flash has preview/quota issue
      if (this.modelName !== "gemini-1.5-flash" && this.client) {
        try {
          const fallbackModel = this.client.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction || undefined,
          });
          const result = await fallbackModel.generateContent(prompt);
          return (await result.response).text();
        } catch (fallbackErr) {
          console.error("Gemini 1.5-flash fallback also failed:", fallbackErr);
        }
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
      // Clean possible markdown code fences if model returned ```json ... ```
      const cleaned = text.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      return JSON.parse(cleaned) as T;
    } catch (parseError) {
      console.error("Failed to parse AI JSON response:", text);
      throw new Error(`Invalid JSON returned by Gemini: ${parseError}`);
    }
  }
}
