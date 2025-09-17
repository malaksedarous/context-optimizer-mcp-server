/**
 * OpenRouter provider implementation
 */

import { BaseLLMProvider, LLMResponse } from './base';

export class OpenRouterProvider extends BaseLLMProvider {
  readonly name = 'OpenRouter';
  readonly defaultModel = 'openai/gpt-4o-mini';
  readonly apiKeyUrl = 'https://openrouter.ai/';
  readonly apiKeyPrefix = undefined; // Not standardized

  async processRequest(prompt: string, model?: string, apiKey?: string): Promise<LLMResponse> {
    if (!apiKey) {
      return this.createErrorResponse('OpenRouter API key not configured');
    }

    try {
      const body = this.createStandardRequest(prompt, model || this.defaultModel);
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      // Add optional branding headers if environment variables are present
      if (process.env.CONTEXT_OPT_APP_URL) {
        headers['HTTP-Referer'] = process.env.CONTEXT_OPT_APP_URL;
      }
      if (process.env.CONTEXT_OPT_APP_NAME) {
        headers['X-Title'] = process.env.CONTEXT_OPT_APP_NAME;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorJson: any = await response.json();
          errorMsg = errorJson?.error?.message || errorMsg;
        } catch {
          // Ignore JSON parsing errors, use HTTP status
        }
        return this.createErrorResponse(`OpenRouter request failed: ${errorMsg}`);
      }

      const json: any = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) {
        return this.createErrorResponse('No response from OpenRouter');
      }

      return this.createSuccessResponse(content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResponse(`OpenRouter processing failed: ${errorMessage}`);
    }
  }
}