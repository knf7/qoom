import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { DEBATE_MODERATOR_AGENT_PROMPT } from '@qoom/prompts';
import { AIResponseValidator } from '@qoom/security';
import { AgentResponse } from '@qoom/types';

@Injectable()
export class DebateModeratorAgent {
  private readonly logger = new Logger(DebateModeratorAgent.name);

  constructor(private readonly geminiService: GeminiService) {}

  async analyze(bundleString: string): Promise<AgentResponse> {
    this.logger.log(`[DebateModeratorAgent] Analyzing swarm contradictions and forcing debate...`);
    try {
      const response = await this.geminiService.queryModel(
        DEBATE_MODERATOR_AGENT_PROMPT,
        bundleString,
        0.3 // slightly higher temp for debate synthesis
      );
      
      return AIResponseValidator.validateAgentResponse(response, 'DebateModeratorAgent');
    } catch (e: any) {
      this.logger.error(`[DebateModeratorAgent] Critical failure during debate synthesis`, e);
      throw e;
    }
  }
}
