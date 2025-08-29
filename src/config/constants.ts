/**
 * Configuration constants for the MCP server
 */

export const RESEARCH_CONFIG = {
  // Quick research timeouts and limits
  QUICK_RESEARCH: {
    POLL_INTERVAL_MS: 10000, // 10 seconds
    MAX_ATTEMPTS: 15,        // 15 attempts = 150 seconds total
    TIMEOUT_MS: 200000,      // 200 seconds
    MODEL: 'exa-research'
  },
  
  // Deep research timeouts and limits  
  DEEP_RESEARCH: {
    POLL_INTERVAL_MS: 15000, // 15 seconds
    MAX_ATTEMPTS: 20,        // 20 attempts = 300 seconds total
    TIMEOUT_MS: 350000,      // 350 seconds
    MODEL: 'exa-research-pro'
  }
} as const;

export const SERVER_CONFIG = {
  DEFAULT_LOG_LEVEL: 'info' as const
} as const;
