/**
 * LLM provider factory and abstractions
 * 
 * Provides unified interface for different LLM providers (Gemini, Claude, OpenAI)
 */

import { BaseLLMProvider, LLMResponse } from './base';
import { GeminiProvider } from './gemini';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';

export interface LLMProvider {
  processRequest(prompt: string, model?: string, apiKey?: string): Promise<LLMResponse>;
}

export class LLMProviderFactory {
  private static providers: Map<string, BaseLLMProvider> = new Map();

  static createProvider(providerName: string): LLMProvider {
    // Use singleton pattern for providers to avoid recreating them
    if (!this.providers.has(providerName)) {
      switch (providerName) {
        case 'gemini':
          this.providers.set(providerName, new GeminiProvider());
          break;
        case 'claude':
          this.providers.set(providerName, new ClaudeProvider());
          break;
        case 'openai':
          this.providers.set(providerName, new OpenAIProvider());
          break;
        case 'openrouter':
          this.providers.set(providerName, new OpenRouterProvider());
          break;
        default:
          throw new Error(`Unknown provider: ${providerName}`);
      }
    }

    return this.providers.get(providerName)!;
  }
}
