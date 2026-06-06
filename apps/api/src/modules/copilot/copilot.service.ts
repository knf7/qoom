import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/gemini.service';
import { COPILOT_ANALYZE_PROMPT, COPILOT_FINALIZE_PROMPT } from '@qoom/prompts';
import { COPILOT_ANALYZE_SCHEMA, COPILOT_FINALIZE_SCHEMA } from '@qoom/security';
import { CopilotAnalyzeResponse, CopilotFinalizeResponse } from '@qoom/types';

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(private readonly gemini: GeminiService) {}

  async analyzeIdea(rawIdea: string): Promise<CopilotAnalyzeResponse> {
    this.logger.log(`Analyzing raw idea for Copilot: ${rawIdea.substring(0, 50)}...`);
    try {
      const response = await this.gemini.queryModel(
        COPILOT_ANALYZE_PROMPT,
        rawIdea,
        3,
        COPILOT_ANALYZE_SCHEMA as any,
        'FLASH'
      );
      let parsed = typeof response === 'string' ? JSON.parse(response) : response;
      return parsed as CopilotAnalyzeResponse;
    } catch (error) {
      this.logger.error('Copilot analysis failed', error);
      throw new Error('فشل في تحليل الفكرة. يرجى المحاولة مرة أخرى.');
    }
  }

  async finalizeIdea(payload: { rawIdea: string; assumptions: any; answers: any }): Promise<CopilotFinalizeResponse> {
    this.logger.log('Finalizing idea profile...');
    const inputStr = JSON.stringify(payload);
    try {
      const response = await this.gemini.queryModel(
        COPILOT_FINALIZE_PROMPT,
        inputStr,
        3,
        COPILOT_FINALIZE_SCHEMA as any,
        'FLASH'
      );
      let parsed = typeof response === 'string' ? JSON.parse(response) : response;
      return parsed as CopilotFinalizeResponse;
    } catch (error) {
      this.logger.error('Copilot finalize failed', error);
      throw new Error('فشل في بناء ملف الفكرة.');
    }
  }
}
