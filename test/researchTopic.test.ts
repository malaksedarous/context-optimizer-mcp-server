/**
 * Tests for ResearchTopicTool
 */

import { ResearchTopicTool } from '../src/tools/researchTopic';
import { ConfigurationManager } from '../src/config/manager';

// Mock dependencies
jest.mock('../src/config/manager');
jest.mock('exa-js');

const mockConfigManager = ConfigurationManager as jest.Mocked<typeof ConfigurationManager>;

describe('ResearchTopicTool', () => {
  let tool: ResearchTopicTool;

  beforeEach(() => {
    tool = new ResearchTopicTool();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Tool Metadata', () => {
    it('should have correct tool name', () => {
      expect(tool.name).toBe('researchTopic');
    });

    it('should have descriptive description', () => {
      expect(tool.description).toContain('quick, focused web research');
      expect(tool.description).toContain('Exa.ai');
    });

    it('should have proper input schema', () => {
      expect(tool.inputSchema).toEqual({
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: expect.stringContaining('research topic')
          }
        },
        required: ['topic']
      });
    });

    it('should convert to MCP tool format correctly', () => {
      const mcpTool = tool.toMCPTool();
      expect(mcpTool.name).toBe('researchTopic');
      expect(mcpTool.description).toBe(tool.description);
      expect(mcpTool.inputSchema).toBe(tool.inputSchema);
    });
  });

  describe('Input Validation', () => {
    it('should reject missing topic', async () => {
      const result = await tool.execute({});
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Missing required field: topic');
      }
    });

    it('should reject empty topic', async () => {
      const result = await tool.execute({ topic: '' });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Missing required field: topic');
      }
    });

    it('should reject whitespace-only topic', async () => {
      const result = await tool.execute({ topic: '   ' });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Missing required field: topic');
      }
    });

    it('should accept valid topic but fail on missing API key', async () => {
      const mockConfig = {
        research: { exaKey: undefined },
        server: { logLevel: 'error' as const }
      };
      mockConfigManager.getConfig.mockReturnValue(mockConfig as any);

      const result = await tool.execute({ topic: 'Valid research topic' });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Exa.ai API key is not configured');
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should reject missing Exa API key', async () => {
      const mockConfig = {
        research: { exaKey: undefined },
        server: { logLevel: 'error' as const }
      };
      mockConfigManager.getConfig.mockReturnValue(mockConfig as any);

      const result = await tool.execute({ topic: 'Valid topic' });
      
      expect(result.isError).toBe(true);
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Exa.ai API key is not configured');
      }
    });
  });

  describe('Quick Research Features', () => {
    it('should use exa-research model for quick research', async () => {
      const mockConfig = {
        research: { exaKey: 'test-api-key' },
        server: { logLevel: 'error' as const }
      };
      mockConfigManager.getConfig.mockReturnValue(mockConfig as any);

      // Mock successful task creation and completion
      const mockTask = {
        id: 'task-123',
        status: 'completed',
        data: {
          result: '# Quick Research Results\n\nFocused insights and practical guidance.'
        }
      };

      const mockExaClient = {
        research: {
          create: jest.fn().mockResolvedValue({ id: 'task-123' }),
          get: jest.fn().mockResolvedValue(mockTask)
        }
      };
      
      const { Exa } = require('exa-js');
      Exa.mockImplementation(() => mockExaClient);

      const result = await tool.execute({ topic: 'Simple research topic' });
      
      expect(result.isError).toBeFalsy();
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Quick Research Results');
      }
  expect(mockExaClient.research.create).toHaveBeenCalledWith({
        instructions: 'Simple research topic',
        model: 'exa-research', // Should use standard model for quick research
        output: { 
          schema: {
            type: 'object',
            properties: { result: { type: 'string' } },
            required: ['result'],
            description: 'Schema with just the result in markdown.'
          }
        }
      });
    });

    it('should have shorter timeout for quick research (120 seconds)', async () => {
      const mockConfig = {
        research: { exaKey: 'test-api-key' },
        server: { logLevel: 'error' as const }
      };
      mockConfigManager.getConfig.mockReturnValue(mockConfig as any);

      // Mock setTimeout to execute immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((callback: () => void) => {
        setImmediate(callback);
        return {} as any;
      }) as any;

      // Mock task that stays running for the timeout duration
      let callCount = 0;
      const mockExaClient = {
        research: {
          create: jest.fn().mockResolvedValue({ id: 'task-123' }),
          get: jest.fn().mockImplementation(() => {
            callCount++;
            // Simulate task running for exactly 120 seconds (12 attempts * 10 seconds)
            if (callCount < 12) {
              return Promise.resolve({ id: 'task-123', status: 'running' });
            }
            return Promise.resolve({
              id: 'task-123',
              status: 'completed',
              data: { result: 'Quick research completed' }
            });
          })
        }
      };
      
      const { Exa } = require('exa-js');
      Exa.mockImplementation(() => mockExaClient);

      const result = await tool.execute({ topic: 'Quick research topic' });
      
      expect(result.isError).toBeFalsy();
      if (result.content[0]) {
        expect(result.content[0].text).toContain('Quick research completed');
      }
      // Should have made 12 calls (the max for quick research)
  expect(mockExaClient.research.get).toHaveBeenCalledTimes(12);

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });
});
