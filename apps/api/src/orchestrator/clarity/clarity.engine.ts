import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../ai/gemini.service';
import { IDEA_CLARITY_PROMPT, IDEA_PARSING_PROMPT } from '@qoom/prompts';
import { CLARITY_SCHEMA, PARSER_SCHEMA, AIResponseValidator } from '@qoom/security';

export interface ClarityResult {
  status: 'CLEAR' | 'UNCLEAR' | 'INVALID';
  clarity_score: number;
  issues: string[];
  suggested_fix: string;
  has_product: boolean;
  has_target_user: boolean;
  has_problem: boolean;
}

export interface ParsedIdeaResult {
  status: 'READY_FOR_ANALYSIS' | 'NEEDS_CLARIFICATION';
  noise_ratio: number;
  clarity: number;
  reason?: string;
  structured_idea?: {
    problem: string;
    target_user: string;
    solution: string;
    category: string;
    business_model_guess: string;
  };
  missing_elements?: string[];
  questions?: string[];
  confidence?: number;
}

@Injectable()
export class ClarityEngine {
  private readonly logger = new Logger(ClarityEngine.name);

  constructor(private readonly gemini: GeminiService) {}

  /**
   * Executes the Intent & Clarity Pipeline.
   * Reconstructs messy input into a valid business brief, or returns a hard stop.
   */
  async analyzeIntentAndClarity(projectDescription: string): Promise<{ clarity: ClarityResult; parsed: ParsedIdeaResult }> {
    this.logger.log('=== ICE: Intent & Clarity Engine Started ===');

    // Step 1: Pre-validation of basic intent
    const clarityResult = await this.runClarityCheck(projectDescription);

    if (clarityResult.status === 'INVALID' || clarityResult.clarity_score < 30) {
      this.logger.warn('[ICE] Idea is completely invalid/gibberish. Hard stop.');
      return { 
        clarity: clarityResult, 
        parsed: {
          status: 'NEEDS_CLARIFICATION',
          noise_ratio: 1.0,
          clarity: clarityResult.clarity_score / 100,
          reason: 'Input is uninterpretable.',
          missing_elements: ['product_definition', 'target_user', 'problem_statement'],
          questions: ['What is your product or service?', 'Who is the target user?', 'What specific problem does it solve?']
        } 
      };
    }

    // Step 2: Semantic Reconstruction
    const parsedResult = await this.runSemanticReconstruction(projectDescription);

    // If ICE detects missing pillars, it overrides to clarification mode
    if (clarityResult.clarity_score < 60 && parsedResult.status !== 'NEEDS_CLARIFICATION') {
      this.logger.warn(`[ICE] Clarity score ${clarityResult.clarity_score} is too low. Forcing clarification mode.`);
      parsedResult.status = 'NEEDS_CLARIFICATION';
      parsedResult.reason = `Your idea needs more detail before we can analyze it. Issues found: ${clarityResult.issues.join('; ')}`;
      parsedResult.questions = [
        ...(parsedResult.questions || []),
        ...(!clarityResult.has_product ? ['What is your product or service?'] : []),
        ...(!clarityResult.has_target_user ? ['Who is the target user or customer?'] : []),
        ...(!clarityResult.has_problem ? ['What specific problem does it solve?'] : [])
      ];
      // Deduplicate questions
      parsedResult.questions = [...new Set(parsedResult.questions)];
    }

    return { clarity: clarityResult, parsed: parsedResult };
  }

  private async runClarityCheck(projectDescription: string): Promise<ClarityResult> {
    const rawClarityOutput = await this.gemini.queryModel(
      IDEA_CLARITY_PROMPT,
      projectDescription,
      2,
      CLARITY_SCHEMA
    );

    try {
      const parsed = JSON.parse(rawClarityOutput.replace(/```json|```/g, '').trim());
      return {
        clarity_score: typeof parsed.clarity_score === 'number' ? parsed.clarity_score : 0,
        status: ['CLEAR', 'UNCLEAR', 'INVALID'].includes(parsed.status) ? parsed.status : 'INVALID',
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        suggested_fix: parsed.suggested_fix || '',
        has_product: !!parsed.has_product,
        has_target_user: !!parsed.has_target_user,
        has_problem: !!parsed.has_problem,
      };
    } catch (e) {
      this.logger.warn('[ICE] Failed to parse clarity response. Treating as INVALID.');
      return {
        clarity_score: 0,
        status: 'INVALID',
        issues: ['Failed to parse clarity check'],
        suggested_fix: 'Please provide a clear startup idea.',
        has_product: false,
        has_target_user: false,
        has_problem: false,
      };
    }
  }

  private async runSemanticReconstruction(projectDescription: string): Promise<ParsedIdeaResult> {
    const rawParserOutput = await this.gemini.queryModel(
      IDEA_PARSING_PROMPT,
      projectDescription,
      2,
      PARSER_SCHEMA
    );
    return AIResponseValidator.validateParserResponse(rawParserOutput);
  }
}
