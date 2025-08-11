/**
 * Configuration manager for loading MCP server configuration from environment variables
 * 
 * All configuration is loaded from environment variables for security and simplicity
 */

import * as fs from 'fs/promises';
import { MCPServerConfig } from './schema';
import { Logger } from '../utils/logger';

export class ConfigurationManager {
  private static config: MCPServerConfig | null = null;
  
  static async loadConfiguration(): Promise<MCPServerConfig> {
    Logger.debug('Loading configuration from environment variables...');
    
    // Build configuration from environment variables
    const config: MCPServerConfig = {
      security: {
        allowedBasePaths: this.parseAllowedBasePaths(),
        maxFileSize: parseInt(process.env.CONTEXT_OPT_MAX_FILE_SIZE || '1048576', 10),
        commandTimeout: parseInt(process.env.CONTEXT_OPT_COMMAND_TIMEOUT || '30000', 10),
        sessionTimeout: parseInt(process.env.CONTEXT_OPT_SESSION_TIMEOUT || '1800000', 10)
      },
      llm: {
        provider: this.getLLMProvider(),
        ...(process.env.CONTEXT_OPT_LLM_MODEL && { model: process.env.CONTEXT_OPT_LLM_MODEL }),
        ...(process.env.CONTEXT_OPT_GEMINI_KEY && { geminiKey: process.env.CONTEXT_OPT_GEMINI_KEY }),
        ...(process.env.CONTEXT_OPT_CLAUDE_KEY && { claudeKey: process.env.CONTEXT_OPT_CLAUDE_KEY }),
        ...(process.env.CONTEXT_OPT_OPENAI_KEY && { openaiKey: process.env.CONTEXT_OPT_OPENAI_KEY }),
        ...(process.env.CONTEXT_OPT_OPENROUTER_KEY && { openrouterKey: process.env.CONTEXT_OPT_OPENROUTER_KEY })
      },
      research: {
        ...(process.env.CONTEXT_OPT_EXA_KEY && { exaKey: process.env.CONTEXT_OPT_EXA_KEY })
      },
      server: {
        ...(process.env.CONTEXT_OPT_SESSION_PATH && { sessionStoragePath: process.env.CONTEXT_OPT_SESSION_PATH }),
        logLevel: (process.env.CONTEXT_OPT_LOG_LEVEL as any) || 'warn'
      }
    };
    
    // Set the logger level from configuration
    Logger.setLogLevel(config.server.logLevel);
    
    // Validate configuration
    this.validateConfiguration(config);
    
    this.config = config;
    Logger.info(`Configuration loaded - provider: ${config.llm.provider}, paths: ${config.security.allowedBasePaths.length}`);
    
    return config;
  }
  
  private static getLLMProvider(): 'gemini' | 'claude' | 'openai' | 'openrouter' {
    const provider = process.env.CONTEXT_OPT_LLM_PROVIDER?.toLowerCase();
    
    if (!provider) {
      throw new Error('CONTEXT_OPT_LLM_PROVIDER environment variable is required. Set to "gemini", "claude", "openai", or "openrouter"');
    }
    
    if (!['gemini', 'claude', 'openai', 'openrouter'].includes(provider)) {
      throw new Error(`Invalid CONTEXT_OPT_LLM_PROVIDER: ${provider}. Must be "gemini", "claude", "openai", or "openrouter"`);
    }
    
    return provider as 'gemini' | 'claude' | 'openai' | 'openrouter';
  }
  
  private static parseAllowedBasePaths(): string[] {
    const pathsEnv = process.env.CONTEXT_OPT_ALLOWED_PATHS;
    
    if (!pathsEnv) {
      throw new Error('CONTEXT_OPT_ALLOWED_PATHS environment variable is required. Set to comma-separated list of allowed directories.');
    }
    
    const paths = pathsEnv.split(',').map(p => p.trim()).filter(Boolean);
    
    if (paths.length === 0) {
      throw new Error('CONTEXT_OPT_ALLOWED_PATHS must contain at least one valid path');
    }
    
    return paths;
  }
  
  private static validateConfiguration(config: MCPServerConfig): void {
    // Validate security boundaries
    if (!config.security || !Array.isArray(config.security.allowedBasePaths)) {
      throw new Error('Configuration error: security.allowedBasePaths must be an array');
    }
    
    if (!config.security.allowedBasePaths.length) {
      throw new Error('Configuration error: allowedBasePaths cannot be empty');
    }
    
    // Validate security timeouts and limits
    if (config.security.maxFileSize <= 0) {
      throw new Error('Configuration error: maxFileSize must be positive');
    }
    
    if (config.security.commandTimeout <= 0) {
      throw new Error('Configuration error: commandTimeout must be positive');
    }
    
    if (config.security.sessionTimeout <= 0) {
      throw new Error('Configuration error: sessionTimeout must be positive');
    }
    
    // Validate LLM configuration
    if (!config.llm || !config.llm.provider) {
      throw new Error('Configuration error: llm.provider is required');
    }
    
    const validProviders = ['gemini', 'claude', 'openai', 'openrouter'];
    if (!validProviders.includes(config.llm.provider)) {
      throw new Error(`Configuration error: llm.provider must be one of: ${validProviders.join(', ')}`);
    }
    
    const providerKey = `${config.llm.provider}Key` as keyof typeof config.llm;
    if (!config.llm[providerKey]) {
      throw new Error(`Configuration error: ${providerKey} is required for provider ${config.llm.provider}`);
    }
    
    // Validate server configuration
    if (!config.server || !config.server.logLevel) {
      throw new Error('Configuration error: server.logLevel is required');
    }
    
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLogLevels.includes(config.server.logLevel)) {
      throw new Error(`Configuration error: server.logLevel must be one of: ${validLogLevels.join(', ')}`);
    }
    
    // Validate paths exist and are accessible (warn if they don't exist)
    for (const basePath of config.security.allowedBasePaths) {
      try {
        require('fs').accessSync(basePath);
        Logger.debug(`Verified allowed base path: ${basePath}`);
      } catch {
        Logger.warn(`Warning: Allowed base path does not exist: ${basePath}`);
      }
    }
    
    // Set default session storage path if not provided
    if (!config.server.sessionStoragePath) {
      const os = require('os');
      const defaultPath = require('path').join(os.tmpdir(), 'context-optimizer-mcp');
      config.server.sessionStoragePath = defaultPath;
      Logger.debug(`Using default session storage path: ${defaultPath}`);
    }
  }
  
  static getConfig(): MCPServerConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfiguration() first.');
    }
    return this.config;
  }
  
  /**
   * Get configuration for a specific LLM provider
   */
  static getLLMConfig(): { provider: string; model?: string; apiKey: string } {
    const config = this.getConfig();
    const provider = config.llm.provider;
    const keyField = `${provider}Key` as keyof typeof config.llm;
    const apiKey = config.llm[keyField] as string;
    
    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }
    
    return {
      provider,
      ...(config.llm.model ? { model: config.llm.model } : {}),
      apiKey
    };
  }
  
  /**
   * Check if research tools are configured
   */
  static isResearchEnabled(): boolean {
    try {
      const config = this.getConfig();
      return !!config.research.exaKey;
    } catch {
      return false;
    }
  }
  
  /**
   * Reset configuration (useful for testing)
   */
  static reset(): void {
    this.config = null;
  }
  
  /**
   * Get sanitized configuration for logging (removes sensitive data)
   */
  static getSanitizedConfig(): any {
    const config = this.getConfig();
    return {
      security: {
        allowedBasePaths: config.security.allowedBasePaths,
        maxFileSize: config.security.maxFileSize,
        commandTimeout: config.security.commandTimeout,
        sessionTimeout: config.security.sessionTimeout
      },
      llm: {
        provider: config.llm.provider,
        model: config.llm.model,
        hasGeminiKey: !!config.llm.geminiKey,
        hasClaudeKey: !!config.llm.claudeKey,
        hasOpenaiKey: !!config.llm.openaiKey,
        hasOpenrouterKey: !!config.llm.openrouterKey
      },
      research: {
        hasExaKey: !!config.research.exaKey
      },
      server: {
        sessionStoragePath: config.server.sessionStoragePath,
        logLevel: config.server.logLevel
      }
    };
  }
}
