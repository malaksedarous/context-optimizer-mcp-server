import execa from 'execa';
import { BaseMCPTool, MCPToolResponse } from './base';
import { PathValidator } from '../security/pathValidator';
import { CommandValidator } from '../security/commandValidator';
import { LLMProviderFactory } from '../providers/factory';
import { ConfigurationManager } from '../config/manager';
import { SessionManager } from '../session/manager';
import { Logger } from '../utils/logger';

export class RunAndExtractTool extends BaseMCPTool {
  readonly name = 'runAndExtract';
  readonly description = 'Execute terminal commands and intelligently extract specific information from their output. Supports cross-platform command execution with security controls.';
  
  readonly inputSchema = {
    type: 'object',
    properties: {
      terminalCommand: {
        type: 'string',
        description: 'Shell command to execute. Must be non-interactive (no user input prompts). Navigation commands (cd, pushd, etc.) are not allowed - use workingDirectory instead.'
      },
      extractionPrompt: {
        type: 'string',
        description: 'Natural language description of what information to extract from the command output. Examples: "Show me the raw output", "Summarize the results", "Extract all error messages", "Find version numbers", "List all files", "Did the command succeed?", "Are there any warnings?"'
      },
      workingDirectory: {
        type: 'string',
        description: 'Full absolute path where command should be executed (e.g., "C:\\Users\\username\\project", "/home/user/project"). Must be within configured security boundaries.'
      }
    },
    required: ['terminalCommand', 'extractionPrompt', 'workingDirectory']
  };
  
  async execute(args: any): Promise<MCPToolResponse> {
    try {
      this.logOperation('Terminal execution started', {
        command: args.terminalCommand,
        workingDirectory: args.workingDirectory
      });
      
      // Validate required fields
      const fieldError = this.validateRequiredFields(args, ['terminalCommand', 'extractionPrompt', 'workingDirectory']);
      if (fieldError) {
        return this.createErrorResponse(fieldError);
      }
      
      // Validate working directory
      const dirValidation = await PathValidator.validateWorkingDirectory(args.workingDirectory);
      if (!dirValidation.valid) {
        return this.createErrorResponse(dirValidation.error!);
      }
      
      // Validate command security
      const commandValidation = CommandValidator.validateCommand(args.terminalCommand);
      if (!commandValidation.valid) {
        return this.createErrorResponse(commandValidation.error!);
      }
      
      // Log warnings if any
      if (commandValidation.warnings) {
        for (const warning of commandValidation.warnings) {
          Logger.warn(`${warning}`);
        }
      }
      
      // Execute command
      const executionResult = await this.executeCommand(
        args.terminalCommand,
        dirValidation.resolvedPath!
      );
      
      // Process output with LLM
      const extractedInfo = await this.processOutputWithLLM(
        args.terminalCommand,
        executionResult.output,
        executionResult.exitCode,
        args.extractionPrompt
      );
      
      // Save session for follow-up questions
      await SessionManager.saveTerminalSession({
        command: args.terminalCommand,
        output: executionResult.output,
        exitCode: executionResult.exitCode,
        extractionPrompt: args.extractionPrompt,
        extractedInfo,
        timestamp: new Date().toISOString(),
        workingDirectory: dirValidation.resolvedPath!
      });
      
      this.logOperation('Terminal execution completed successfully');
      return this.createSuccessResponse(extractedInfo);
      
    } catch (error) {
      this.logOperation('Terminal execution failed', { error });
      return this.createErrorResponse(
        `Terminal execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  private async executeCommand(command: string, workingDirectory: string): Promise<{
    output: string;
    exitCode: number;
    success: boolean;
  }> {
    const config = ConfigurationManager.getConfig();
    
    try {
      const result = await execa(command, {
        shell: true,
        cwd: workingDirectory,
        timeout: config.security.commandTimeout,
        all: true,                           // Capture both stdout and stderr
        reject: false                        // Don't throw on non-zero exit codes
      });
      
      return {
        output: result.all || result.stdout || result.stderr || '',
        exitCode: result.exitCode || 0,
        success: result.exitCode === 0
      };
    } catch (error: any) {
      if (error.timedOut) {
        throw new Error(`Command timed out after ${config.security.commandTimeout}ms. This may indicate an interactive command or infinite loop.`);
      }
      
      // Return partial results if available
      return {
        output: error.all || error.stdout || error.stderr || `Command failed: ${error.message}`,
        exitCode: error.exitCode || 1,
        success: false
      };
    }
  }
  
  private async processOutputWithLLM(
    command: string,
    output: string,
    exitCode: number,
    extractionPrompt: string
  ): Promise<string> {
    const config = ConfigurationManager.getConfig();
    const provider = LLMProviderFactory.createProvider(config.llm.provider);
    const apiKey = this.getApiKey(config.llm.provider, config.llm);
    
    const prompt = this.createTerminalExtractionPrompt(output, extractionPrompt, command, exitCode);
    const response = await provider.processRequest(prompt, config.llm.model, apiKey);
    
    if (!response.success) {
      throw new Error(`LLM processing failed: ${response.error}`);
    }
    
    return response.content;
  }
  
  private createTerminalExtractionPrompt(
    commandOutput: string,
    extractionPrompt: string,
    terminalCommand: string,
    exitCode: number
  ): string {
    return `You are an expert at summarizing terminal command output and extracting specific information.

Command executed: ${terminalCommand}
Exit code: ${exitCode}
Extraction request: ${extractionPrompt}

Instructions:
- Focus only on what the user specifically requested
- Be concise and well-formatted
- Use markdown formatting for better readability
- If the command failed (non-zero exit code), mention this clearly
- If there's no relevant information, say so clearly

Command output:
${commandOutput}`;
  }
  
  private getApiKey(provider: string, llmConfig: any): string {
    const keyField = `${provider}Key`;
    const key = llmConfig[keyField];
    if (!key) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }
    return key;
  }
}
