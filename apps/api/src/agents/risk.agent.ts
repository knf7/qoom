import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { RISK_AGENT_PROMPT } from '@qoom/prompts';
import { AIResponseValidator, AGENT_RESPONSE_SCHEMA } from '@qoom/security';
import { AgentResponse } from '@qoom/types';
import { SearchLayer } from '../knowledge/search.layer';

@Injectable()
export class RiskAgent {
  private readonly logger = new Logger(RiskAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  async analyze(projectDescription: string): Promise<AgentResponse> {
    this.logger.log('Starting Venture Risk scanning...');
    
    let attempts = 0;
    const maxRetries = 2;
    let lastValidated: AgentResponse | null = null;

    const fullPrompt = RISK_AGENT_PROMPT + '\n' + SearchLayer.getSourcesPromptInstruction('RiskAgent');

    while (attempts <= maxRetries) {
      try {
        const rawResponse = await this.gemini.queryModel(
          fullPrompt,
          `Project Startup Concept to analyze:\n${projectDescription}`,
          2,
          AGENT_RESPONSE_SCHEMA
        );

        const validated = AIResponseValidator.validateAgentResponse(rawResponse, 'RiskAgent');
        this.logger.log(`Venture Risk score compiled on attempt ${attempts + 1}`);
        return validated;
      } catch (err: any) {
        this.logger.warn(`RiskAgent execution error on attempt ${attempts + 1}: ${err.message}`);
      }
      
      attempts++;
    }

    this.logger.error(`RiskAgent failed all ${maxRetries + 1} attempts. Returning secure fallback.`);
    return lastValidated || AIResponseValidator.validateAgentResponse('', 'RiskAgent');
  }
}
