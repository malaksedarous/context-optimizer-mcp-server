import { AskFollowUpTool } from '../src/tools/askFollowUp';
import { SessionManager } from '../src/session/manager';
import { ConfigurationManager } from '../src/config/manager';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Integration test for AskFollowUpTool
 * 
 * This test verifies the follow-up question functionality works correctly
 * with session management and LLM integration.
 */

describe('AskFollowUpTool Integration', () => {
  let tool: AskFollowUpTool;

  // Check if we have real API keys before setting up mocks
  const hasApiKeys = !!(process.env.CONTEXT_OPT_GEMINI_KEY || process.env.CONTEXT_OPT_CLAUDE_KEY || process.env.CONTEXT_OPT_OPENAI_KEY);

  beforeAll(async () => {
    // Set up environment variables for testing
    process.env.CONTEXT_OPT_LLM_PROVIDER = hasApiKeys ? 
      (process.env.CONTEXT_OPT_GEMINI_KEY ? 'gemini' : process.env.CONTEXT_OPT_CLAUDE_KEY ? 'claude' : 'openai') : 
      'gemini';
    
    if (!hasApiKeys) {
      process.env.CONTEXT_OPT_GEMINI_KEY = 'test-api-key';
    }
    
    process.env.CONTEXT_OPT_ALLOWED_PATHS = process.cwd();
    process.env.CONTEXT_OPT_EXA_KEY = process.env.CONTEXT_OPT_EXA_KEY || 'test-key';
    process.env.CONTEXT_OPT_LOG_LEVEL = 'error';
    
    await ConfigurationManager.loadConfiguration();
    tool = new AskFollowUpTool();
  });

  afterEach(async () => {
    // Clean up any session files
    await SessionManager.clearTerminalSession();
  });

  describe('Input Validation', () => {
    it('should require question parameter', async () => {
      const result = await tool.execute({});
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('Missing required field: question');
    });

    it('should reject empty question', async () => {
      const result = await tool.execute({ question: '' });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('Missing required field: question');
    });

    it('should reject whitespace-only question', async () => {
      const result = await tool.execute({ question: '   ' });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('Missing required field: question');
    });
  });

  describe('Session Management', () => {
    it('should fail when no terminal session exists', async () => {
      const result = await tool.execute({ 
        question: 'What was the output of the command?' 
      });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('No recent terminal execution found');
      expect(result.content[0]?.text).toContain('use the runAndExtract tool first');
    });

    // Conditional test for LLM integration - skip if no API keys
    if (hasApiKeys) {
      it('should work when valid terminal session exists (requires API key)', async () => {
        // Create a mock session
        await SessionManager.saveTerminalSession({
          command: 'echo "Hello World"',
          output: 'Hello World\n',
          exitCode: 0,
          extractionPrompt: 'Show me the output',
          extractedInfo: 'The command output is: Hello World',
          timestamp: new Date().toISOString(),
          workingDirectory: process.cwd()
        });

        const result = await tool.execute({ 
          question: 'What was the exact output?' 
        });
        
        expect(result.isError).toBeFalsy();
        expect(result.content).toHaveLength(1);
        expect(result.content[0]?.text).toBeTruthy();
      }, 30000); // 30 second timeout for LLM API calls
    } else {
      it('should skip LLM integration test (no API keys)', () => {
        console.log('⏭️ Skipping LLM integration test - no API keys provided');
        expect(true).toBe(true); // Placeholder assertion
      });
    }

    it('should handle expired sessions', async () => {
      // Create an expired session (1 hour ago)
      const expiredTimestamp = new Date(Date.now() - 3600000).toISOString();
      
      await SessionManager.saveTerminalSession({
        command: 'echo "Hello World"',
        output: 'Hello World\n',
        exitCode: 0,
        extractionPrompt: 'Show me the output',
        extractedInfo: 'The command output is: Hello World',
        timestamp: expiredTimestamp,
        workingDirectory: process.cwd()
      });

      const result = await tool.execute({ 
        question: 'What was the output?' 
      });
      
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.text).toContain('No recent terminal execution found');
    });
  });

  describe('Tool Properties', () => {
    it('should have correct tool properties', () => {
      expect(tool.name).toBe('askFollowUp');
      expect(tool.description).toContain('follow-up questions');
      expect(tool.description).toContain('runAndExtract tool');
      
      const mcpTool = tool.toMCPTool();
      expect(mcpTool.name).toBe('askFollowUp');
      expect(mcpTool.inputSchema).toBeDefined();
    });

    it('should have proper input schema', () => {
      const schema = tool.inputSchema as any;
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('question');
      expect(schema.properties.question).toBeDefined();
      expect(schema.properties.question.type).toBe('string');
    });
  });
});
