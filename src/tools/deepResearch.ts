/**
 * Deep Research Tool - Conducts comprehensive, in-depth research using Exa.ai's API
 * Ported from VS Code extension to MCP server
 */

import { BaseMCPTool, MCPToolResponse } from './base';
import { ConfigurationManager } from '../config/manager';
import Exa from 'exa-js';

interface DeepResearchInput {
  topic: string;
}

interface ExaTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: {
    result?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ExaResponse {
  result: string; // The report in markdown
  raw: object;    // The full Exa.ai response
}

export class DeepResearchTool extends BaseMCPTool {
  readonly name = 'deepResearch';
  readonly description = 'Conduct comprehensive, in-depth research using Exa.ai\'s exhaustive analysis capabilities for critical decision-making and complex architectural planning.';

  readonly inputSchema = {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string' as const,
        description: 'The research topic or problem you want to investigate comprehensively. Be as detailed as possible about what you want to learn, including technical requirements, architectural considerations, performance needs, security concerns, or strategic implications you want analyzed in depth.'
      }
    },
    required: ['topic']
  };

  async execute(args: any): Promise<MCPToolResponse> {
    try {
      // Validate input
      const validationError = this.validateRequiredFields(args, ['topic']);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const input = args as DeepResearchInput;
      
      // Validate topic is not empty
      if (!input.topic.trim()) {
        return this.createErrorResponse('Topic cannot be empty');
      }

      // Get configuration
      const config = ConfigurationManager.getConfig();
      if (!config.research.exaKey) {
        return this.createErrorResponse(
          'Exa.ai API key is not configured. Please set the exaKey in your configuration or EXA_KEY environment variable.'
        );
      }

      this.logOperation(`Starting deep research for topic: ${input.topic}`);

      // Conduct research
      const result = await this.conductDeepResearch(input.topic, config.research.exaKey);
      
      this.logOperation('Deep research completed successfully');

      return this.createSuccessResponse(result.result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation(`Deep research failed: ${errorMessage}`);
      return this.createErrorResponse(`Research failed: ${errorMessage}`);
    }
  }

  private async conductDeepResearch(topic: string, exaKey: string): Promise<ExaResponse> {
    const client = new Exa(exaKey);

    try {
      const schema = {
        type: 'object' as const,
        properties: {
          result: { type: 'string' as const }
        },
        required: ['result'],
        description: 'Schema with just the result in markdown.'
      };

      if (!client?.research || typeof (client as any).research.createTask !== 'function') {
        throw new Error('Exa.js SDK is outdated or incompatible. Please update exa-js to version 1.5.0 or newer.');
      }

      this.logOperation('Creating Exa deep research task');
      const task = await client.research.createTask({
        instructions: topic,
        model: 'exa-research-pro', // Deep research model
        output: { schema },
      });

      this.logOperation(`Task created with ID: ${task.id}. Polling for results...`);
      const result = typeof (client as any).research.pollTask === 'function'
        ? await (client as any).research.pollTask(task.id)
        : await this.pollTask(client, task.id);
      
      return this.formatResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to conduct deep research with Exa.ai.';
      throw new Error(`Exa.ai deep research failed: ${errorMessage}`);
    }
  }

  private async pollTask(client: Exa, taskId: string): Promise<ExaTask> {
    let attempts = 0;
    const maxAttempts = 18; // 18 attempts * 10 seconds = 180 seconds timeout (longer for deep research)
    
    while (attempts < maxAttempts) {
      const task = await client.research.getTask(taskId);
      
      if (task.status === 'completed') {
        this.logOperation('Deep research task completed');
        return task;
      }
      
      if (task.status === 'failed') {
        throw new Error('Deep research task failed');
      }
      
      if (task.status === 'running' || task.status === 'pending') {
        this.logOperation(`Task status: ${task.status}... (${attempts * 10}s elapsed)`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } else {
        // Unexpected status
        throw new Error(`Unexpected task status: ${task.status}`);
      }
    }
    
    // Timeout after 180 seconds (longer for deep research)
    throw new Error('Deep research task timed out after 180 seconds');
  }

  private formatResponse(result: ExaTask): ExaResponse {
    if (!result?.data?.result) {
      throw new Error('Malformed response from Exa.ai - missing result data');
    }
    return {
      result: result.data.result,
      raw: result,
    };
  }
}
