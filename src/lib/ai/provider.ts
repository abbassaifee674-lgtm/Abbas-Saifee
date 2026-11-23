export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string, options?: AICompletionOptions): Promise<string>;
  generateJSON<T>(prompt: string, systemInstruction?: string, options?: AICompletionOptions): Promise<T>;
}

import { GeminiProvider } from "./gemini";

export function getAIProvider(): AIProvider {
  // Free tier default: Gemini 2.0 Flash / 1.5 Flash
  return new GeminiProvider();
}
