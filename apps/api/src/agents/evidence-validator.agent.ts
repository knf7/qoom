import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { EVIDENCE_VALIDATOR_AGENT_PROMPT } from '@qoom/prompts';
import { AIResponseValidator, VALIDATOR_SCHEMA } from '@qoom/security';
import { EvidenceValidatorResult, AgentResponse } from '@qoom/types';

export interface EvidencePack {
  domain: string;
  regionalBenchmarks: {
    tamKSA: string;
    growthRateYoY: string;
    avgCAC: string;
    avgLtvPaybackMonths: string;
  };
  competitorTelemetry: string[];
  paymentRailsOptions: string[];
  regulatoryCompliancePaths: string[];
}

@Injectable()
export class EvidenceValidatorAgent {
  private readonly logger = new Logger(EvidenceValidatorAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  /**
   * Performs double-blind Red Team auditing of agent due diligence claims against Ground Truth KRL Evidence.
   */
  async validate(
    projectDescription: string,
    evidencePack: EvidencePack,
    agentResults: Record<string, AgentResponse>
  ): Promise<EvidenceValidatorResult> {
    this.logger.log('Starting double-blind Evidence Validation audit (Red Team)...');

    const agentSummaries = Object.entries(agentResults)
      .map(([agentName, result]) => {
        const rec = result.sections?.recommendation?.content || '';
        const gaps = result.sections?.unknown?.items?.join(', ') || '';
        const analysis = result.sections?.analysis?.content || '';
        return `
[AGENT: ${agentName}]
Score: ${result.score}
Recommendation: ${rec}
Missing Data: ${gaps}
Key Metrics & Reasoning Claims: ${analysis}
`;
      })
      .join('\n');

    const promptBody = `
========================================
STRUCTURED STARTUP IDEA
========================================
${projectDescription}

========================================
EVIDENCE PACK (GROUND TRUTH LOCAL DATA)
========================================
Domain: ${evidencePack.domain}
TAM/Benchmarks: ${JSON.stringify(evidencePack.regionalBenchmarks, null, 2)}
Competitors: ${evidencePack.competitorTelemetry.join(', ')}
Payment Rails: ${evidencePack.paymentRailsOptions.join(', ')}
Regulations: ${evidencePack.regulatoryCompliancePaths.join(', ')}

========================================
AGENT DUE DILIGENCE CLAIMS TO AUDIT
========================================
${agentSummaries}
`;

    let attempts = 0;
    const maxRetries = 2;
    let lastValidated: EvidenceValidatorResult | null = null;

    while (attempts <= maxRetries) {
      try {
        const rawResponse = await this.gemini.queryModel(
          EVIDENCE_VALIDATOR_AGENT_PROMPT,
          promptBody,
          2,
          VALIDATOR_SCHEMA
        );

        const validated = AIResponseValidator.validateValidatorResponse(rawResponse);

        // Check if parsing succeeded and did not hit compliance fallback warning
        if (
          validated.adjusted_score_factor !== 0.85 ||
          validated.reasoning !==
            'Strategic Audit Alert: The auditor agent output could not be parsed. Automatic defensive downgrade factor applied.'
        ) {
          this.logger.log(`Evidence Validation audit complete. Grounded factor: ${validated.adjusted_score_factor}`);
          return validated;
        }

        lastValidated = validated;
        this.logger.warn(
          `EvidenceValidatorAgent JSON validation failed (compliance error). Attempt ${attempts + 1} of ${maxRetries + 1}`
        );
      } catch (err: any) {
        this.logger.warn(`EvidenceValidatorAgent execution error on attempt ${attempts + 1}: ${err.message}`);
      }

      attempts++;
    }

    this.logger.error(`EvidenceValidatorAgent failed all ${maxRetries + 1} attempts. Returning fallback factor.`);
    return (
      lastValidated || {
        valid: false,
        adjusted_score_factor: 0.85,
        confidence_adjustment: 0.8,
        critiques: ['Validation system compiled critiques defaulted due to parsing failure.'],
        evidence_gaps: ['Evidence parsing could not be verified securely.'],
        reasoning:
          'Strategic Audit Alert: The auditor agent output could not be parsed. Automatic defensive downgrade factor applied.',
      }
    );
  }
}
