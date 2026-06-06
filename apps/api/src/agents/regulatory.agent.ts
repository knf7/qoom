import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { REGULATORY_AGENT_PROMPT } from '@qoom/prompts';
import { AIResponseValidator, AGENT_RESPONSE_SCHEMA } from '@qoom/security';
import { AgentResponse } from '@qoom/types';
import { SearchLayer } from '../knowledge/search.layer';

@Injectable()
export class RegulatoryAgent {
  private readonly logger = new Logger(RegulatoryAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  async analyze(projectDescription: string): Promise<AgentResponse> {
    this.logger.log('Starting Regulatory Compliance scanning...');
    
    let attempts = 0;
    const maxRetries = 2;
    let lastValidated: AgentResponse | null = null;

    const fullPrompt = REGULATORY_AGENT_PROMPT + '\n' + SearchLayer.getSourcesPromptInstruction('RegulatoryAgent');

    while (attempts <= maxRetries) {
      try {
        const rawResponse = await this.gemini.queryModel(
          fullPrompt,
          `Project Startup Concept to analyze:\n${projectDescription}`,
          2,
          AGENT_RESPONSE_SCHEMA
        );

        const validated = AIResponseValidator.validateAgentResponse(rawResponse, 'RegulatoryAgent');
        this.logger.log(`Regulatory Compliance score compiled on attempt ${attempts + 1}`);
        return validated;
      } catch (err: any) {
        this.logger.warn(`RegulatoryAgent execution error on attempt ${attempts + 1}: ${err.message}`);
      }
      
      attempts++;
    }

    this.logger.error(`RegulatoryAgent failed all ${maxRetries + 1} attempts. Returning secure fallback.`);
    return lastValidated || AIResponseValidator.validateAgentResponse('', 'RegulatoryAgent');
  }
}
