import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { CLARITY_AGENT_PROMPT } from '@qoom/prompts';

@Injectable()
export class ClarityAgent {
  private readonly logger = new Logger(ClarityAgent.name);

  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Reconstructs the idea, forces structure on gibberish/hybrid inputs,
   * and blocks execution if critical context is missing.
   */
  async analyze(input: string): Promise<any> {
    this.logger.log(`[ClarityAgent] Reconstructing and validating intent...`);

    const schema = {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['CLEAR', 'NEEDS_CLARIFICATION', 'INVALID'] },
        clarity_score: { type: 'INTEGER' },
        issues: { type: 'ARRAY', items: { type: 'STRING' } },
        suggested_fix: { type: 'STRING' },
        structured_idea: {
          type: 'OBJECT',
          properties: {
            startupName: { type: 'STRING' },
            category: { type: 'STRING' },
            subcategory: { type: 'STRING' },
            customerType: { type: 'STRING' },
            targetAudience: { type: 'STRING' },
            problemStatement: { type: 'STRING' },
            proposedSolution: { type: 'STRING' },
            monetizationModel: { type: 'STRING' },
            acquisitionModel: { type: 'STRING' },
            marketType: { type: 'STRING' },
            geographicFocus: { type: 'STRING' },
            operationalComplexity: { type: 'INTEGER' },
            regulationLevel: { type: 'INTEGER' },
            capitalIntensity: { type: 'INTEGER' },
            defensibility: { type: 'INTEGER' },
            networkEffects: { type: 'INTEGER' },
            scalability: { type: 'INTEGER' },
            aiDependency: { type: 'INTEGER' },
            logisticsDependency: { type: 'INTEGER' },
            complianceDependency: { type: 'INTEGER' },
            competitiveRisk: { type: 'INTEGER' },
            executionDifficulty: { type: 'INTEGER' },
            clarityScore: { type: 'INTEGER' }
          },
          required: [
            'category', 'customerType', 'targetAudience', 'problemStatement',
            'proposedSolution', 'monetizationModel', 'acquisitionModel',
            'marketType', 'geographicFocus', 'operationalComplexity',
            'regulationLevel', 'capitalIntensity', 'defensibility',
            'networkEffects', 'scalability', 'aiDependency',
            'logisticsDependency', 'complianceDependency', 'competitiveRisk',
            'executionDifficulty', 'clarityScore'
          ]
        },
        missing_elements: { type: 'ARRAY', items: { type: 'STRING' } },
        questions: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['status', 'clarity_score', 'issues']
    };

    const response = await this.geminiService.queryModel(
      CLARITY_AGENT_PROMPT || 'You are the Idea Clarity Agent. Analyze the input startup idea. Reject gibberish with INVALID. Reject partial ideas with NEEDS_CLARIFICATION and list questions. Otherwise return CLEAR with structured_idea.',
      input,
      2,
      schema
    );

    const parsed = JSON.parse(response);
    return parsed;
  }
}
