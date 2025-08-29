import { RunAndExtractTool } from '../src/tools/runAndExtract';
import { ConfigurationManager } from '../src/config/manager';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Integration test for RunAndExtractTool
 * 
 * This test verifies the terminal execution functionality works correctly
 * with proper security validation and LLM integration.
 */

describe('RunAndExtractTool Integration', () => {
  let tool: RunAndExtractTool;
  let testWorkingDir: string;

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
    tool = new RunAndExtractTool();
    testWorkingDir = process.cwd();
  });

  describe('Parameter Validation', () => {
    it('should reject missing required parameters', async () => {
      const result = await tool.execute({});
      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Missing required field');
    });

    it('should reject empty parameters', async () => {
      const result = await tool.execute({
        terminalCommand: '',
        extractionPrompt: '',
        workingDirectory: ''
      });
      expect(result.isError).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should reject paths outside allowed directories', async () => {
      const result = await tool.execute({
        terminalCommand: 'echo "test"',
        extractionPrompt: 'Show me the output',
        workingDirectory: '/unauthorized/path'
      });
      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('outside allowed paths');
    });

    it('should reject interactive commands', async () => {
      const result = await tool.execute({
        terminalCommand: 'vim test.txt',
        extractionPrompt: 'Show me the output',
        workingDirectory: testWorkingDir
      });
      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Interactive command detected');
    });

    it('should reject navigation commands', async () => {
      const result = await tool.execute({
        terminalCommand: 'cd /some/path',
        extractionPrompt: 'Show me the output',
        workingDirectory: testWorkingDir
      });
      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Navigation command detected');
    });

    it('should reject dangerous commands', async () => {
      const result = await tool.execute({
        terminalCommand: 'rm -rf /',
        extractionPrompt: 'Show me the output',
        workingDirectory: testWorkingDir
      });
      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Dangerous command detected');
    });
  });

  describe('Command Execution', () => {
    it('should execute simple commands successfully', async () => {
      const result = await tool.execute({
        terminalCommand: 'echo "Hello World"',
        extractionPrompt: 'Show me the raw output',
        workingDirectory: testWorkingDir
      });
      
      // Note: This test may fail if no real LLM key is provided
      // In that case, it should still show proper error handling
      if (result.isError) {
        const errorText = result.content?.[0]?.text || '';
        expect(errorText).toMatch(/API key not configured|API key not valid|Error fetching from/);
      } else {
        expect(result.isError).toBeFalsy();
        expect(result.content?.[0]?.text).toContain('Hello World');
      }
    }, 30000); // 30 second timeout for LLM API calls

    // Conditional test for LLM integration - skip if no API keys
    if (hasApiKeys) {
      it('should handle commands with non-zero exit codes (requires API key)', async () => {
        const result = await tool.execute({
          terminalCommand: 'exit 1',
          extractionPrompt: 'Did the command succeed?',
          workingDirectory: testWorkingDir
        });
        
        // Should not error out due to non-zero exit code
        // The LLM should be able to process and explain the failure
        expect(result.isError).toBeFalsy();
        expect(result.content?.[0]?.text).toBeDefined();
      }, 30000); // 30 second timeout for LLM API calls
    } else {
      it('should skip LLM integration test (no API keys)', () => {
        console.log('⏭️ Skipping LLM integration test - no API keys provided');
        expect(true).toBe(true); // Placeholder assertion
      });
    }
  });

  describe('Tool Interface', () => {
    it('should have correct MCP tool definition', () => {
      const mcpTool = tool.toMCPTool();
      
      expect(mcpTool.name).toBe('runAndExtract');
      expect(mcpTool.description).toContain('Execute terminal commands');
      expect(mcpTool.inputSchema).toHaveProperty('properties');
      expect(mcpTool.inputSchema.properties).toHaveProperty('terminalCommand');
      expect(mcpTool.inputSchema.properties).toHaveProperty('extractionPrompt');
      expect(mcpTool.inputSchema.properties).toHaveProperty('workingDirectory');
    });

    it('should define all required fields correctly', () => {
      const mcpTool = tool.toMCPTool();
      const required = mcpTool.inputSchema.required;
      
      expect(required).toContain('terminalCommand');
      expect(required).toContain('extractionPrompt');
      expect(required).toContain('workingDirectory');
    });
  });
});
