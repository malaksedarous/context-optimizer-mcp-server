/**
 * Research Topic Tool - Conducts quick, focused web research using Exa.ai's API
 * Ported from VS Code extension to MCP server
 */

import { MCPToolResponse } from './base';
import { BaseResearchTool } from './baseResearch';
import { ConfigurationManager } from '../config/manager';
import { ExaTask, ExaResponse } from '../types/exa';
import { RESEARCH_CONFIG } from '../config/constants';
import Exa from 'exa-js';

interface ResearchTopicInput {
  topic: string;
}

export class ResearchTopicTool extends BaseResearchTool {
  readonly name = 'researchTopic';
  readonly description = 'Conduct quick, focused web research on software development topics using Exa.ai\'s powerful research capabilities for current information and practical implementation guidance.';

  readonly inputSchema = {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string' as const,
        description: 'The research topic or problem you want to investigate. Be as detailed as possible about what you want to learn, any specific aspects to focus on, timeframes, geographical scope, or particular angles of interest.'
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

      const input = args as ResearchTopicInput;
      
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

      this.logOperation(`Starting quick research for topic: ${input.topic}`);

      // Conduct research
      const result = await this.conductQuickResearch(input.topic, config.research.exaKey);
      
      this.logOperation('Quick research completed successfully');

      return this.createSuccessResponse(result.result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logOperation(`Research failed: ${errorMessage}`);
      return this.createErrorResponse(`Research failed: ${errorMessage}`);
    }
  }

  private async conductQuickResearch(topic: string, exaKey: string): Promise<ExaResponse> {
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

      this.logOperation('Creating Exa research task');
      const task = await client.research.createTask({
        instructions: topic,
        model: RESEARCH_CONFIG.QUICK_RESEARCH.MODEL,
        output: { schema },
      });

      this.logOperation(`Task created with ID: ${task.id}. Polling for results...`);
      const result = await this.pollTaskWithFallback(
        client, 
        task.id, 
        RESEARCH_CONFIG.QUICK_RESEARCH.MAX_ATTEMPTS,
        RESEARCH_CONFIG.QUICK_RESEARCH.POLL_INTERVAL_MS,
        RESEARCH_CONFIG.QUICK_RESEARCH.TIMEOUT_MS
      );
      
      return this.formatResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to conduct research with Exa.ai.';
      throw new Error(`Exa.ai research failed: ${errorMessage}`);
    }
  }
}
