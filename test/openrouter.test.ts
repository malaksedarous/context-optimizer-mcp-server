/**
 * Tests for OpenRouter provider
 */

import { OpenRouterProvider } from '../src/providers/openrouter';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;
  
  beforeEach(() => {
    provider = new OpenRouterProvider();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Provider properties', () => {
    it('should have correct provider properties', () => {
      expect(provider.name).toBe('OpenRouter');
      expect(provider.defaultModel).toBe('openai/gpt-4o-mini');
      expect(provider.apiKeyUrl).toBe('https://openrouter.ai/');
      expect(provider.apiKeyPrefix).toBeUndefined();
    });
  });

  describe('processRequest', () => {
    it('should return error when API key is not provided', async () => {
      const result = await provider.processRequest('test prompt');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter API key not configured');
      expect(result.content).toBe('');
    });

    it('should make successful request and return content', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Test response from OpenRouter'
              }
            }
          ]
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', 'test-model', 'test-api-key');
      
      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response from OpenRouter');
      expect(result.error).toBeUndefined();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'test-model',
            temperature: 0.1,
            max_tokens: 4000,
            messages: [{ role: 'user', content: 'test prompt' }]
          })
        }
      );
    });

    it('should use default model when model is not specified', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Response with default model'
              }
            }
          ]
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"model":"openai/gpt-4o-mini"')
        })
      );
    });

    it('should include optional branding headers when environment variables are set', async () => {
      // Set environment variables
      process.env.CONTEXT_OPT_APP_URL = 'https://example.com';
      process.env.CONTEXT_OPT_APP_NAME = 'Test App';

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }]
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://example.com',
            'X-Title': 'Test App'
          })
        })
      );

      // Clean up environment variables
      delete process.env.CONTEXT_OPT_APP_URL;
      delete process.env.CONTEXT_OPT_APP_NAME;
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: {
            message: 'Bad Request - Invalid model'
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter request failed: Bad Request - Invalid model');
      expect(result.content).toBe('');
    });

    it('should handle HTTP error without error JSON', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter request failed: HTTP 500');
      expect(result.content).toBe('');
    });

    it('should handle malformed response (no choices)', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          // Missing choices array
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from OpenRouter');
      expect(result.content).toBe('');
    });

    it('should handle malformed response (empty choices)', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: []
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from OpenRouter');
      expect(result.content).toBe('');
    });

    it('should handle fetch network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter processing failed: Network error');
      expect(result.content).toBe('');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue('Unknown error type');

      const result = await provider.processRequest('test prompt', undefined, 'test-api-key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenRouter processing failed: Unknown error');
      expect(result.content).toBe('');
    });
  });
});