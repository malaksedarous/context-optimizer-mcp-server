/**
 * Shared type definitions for Exa.ai integration
 */

export interface ExaTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: {
    result?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ExaResponse {
  result: string; // The report in markdown
  raw: object;    // The full Exa.ai response
}
