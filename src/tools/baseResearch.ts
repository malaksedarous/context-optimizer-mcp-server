/**
 * Base class for Exa.ai research tools
 * Provides common functionality for polling tasks and formatting responses
 */

import { BaseMCPTool } from './base';
import { ExaTask, ExaResponse } from '../types/exa';
import Exa from 'exa-js';

export abstract class BaseResearchTool extends BaseMCPTool {
  /**
   * Poll an Exa research task until completion or timeout
   */
  protected async pollTask(client: Exa, taskId: string, maxAttempts: number, pollIntervalMs: number, timeoutMs: number): Promise<ExaTask> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const task = await client.research.getTask(taskId);
      
      if (task.status === 'completed') {
        this.logOperation('Research task completed');
        return task;
      }
      
      if (task.status === 'failed') {
        throw new Error('Research task failed');
      }
      
      if (task.status === 'running' || task.status === 'pending') {
        this.logOperation(`Task status: ${task.status}... (${attempts * pollIntervalMs / 1000}s elapsed)`);
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        attempts++;
      } else {
        // Unexpected status
        throw new Error(`Unexpected task status: ${task.status}`);
      }
    }
    
    // Timeout after configured duration
    throw new Error(`Research task timed out after ${timeoutMs / 1000} seconds`);
  }

  /**
   * Format the Exa task result into a standardized response
   */
  protected formatResponse(result: ExaTask): ExaResponse {
    if (!result?.data?.result) {
      throw new Error('Malformed response from Exa.ai - missing result data');
    }
    return {
      result: result.data.result,
      raw: result,
    };
  }

  /**
   * Check if the Exa client has a built-in pollTask method and use it, 
   * otherwise fall back to our implementation
   */
  protected async pollTaskWithFallback(
    client: Exa, 
    taskId: string, 
    maxAttempts: number, 
    pollIntervalMs: number, 
    timeoutMs: number
  ): Promise<ExaTask> {
    // Use type assertion with specific property check for better type safety
    const clientWithPollTask = client as Exa & { research: { pollTask?: (taskId: string) => Promise<ExaTask> } };
    if (clientWithPollTask.research.pollTask) {
      return await clientWithPollTask.research.pollTask(taskId);
    }
    return await this.pollTask(client, taskId, maxAttempts, pollIntervalMs, timeoutMs);
  }
}
