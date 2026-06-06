import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { RealityEvidencePack } from '../reality/reality-score.engine';

export interface RealityAuditResult {
  verdict: 'AUTHENTIC' | 'WRAPPER_STARTUP' | 'BUZZWORD_ABUSE' | 'CLONE' | 'NEEDS_RECONSTRUCTION';
  authenticity_score: number; // 0–100
  detected_issues: string[];
  buzzword_penalty: number;    // 0–30 points deducted
  clone_indicators: string[];
  differentiation_analysis: string;
  audit_note: string;
}

const AUDITOR_SYSTEM_PROMPT = `You are the Reality Auditor Agent of QOOM V9 — an adversarial AI designed to detect fake innovation, buzzword abuse, and wrapper startups.

Your mission is to CHALLENGE the idea, not validate it.

Detect:
1. WRAPPER_STARTUP: "We use AI/blockchain/ML to do X" — where removing AI doesn't change the core value
2. BUZZWORD_ABUSE: Ideas filled with "disruptive", "game-changing", "revolutionary" without substance
3. CLONE: Direct copy of an existing product with no differentiation (e.g., "Uber for X" with zero moat)
4. NEEDS_RECONSTRUCTION: Idea is too vague to audit

Anti-Hallucination Rules:
- Base your assessment on the reality evidence provided
- If competitors exist in evidence, call them out by name
- Do NOT give high authenticity scores to buzzword-heavy ideas
- If saturation is HIGH from evidence, penalize accordingly

Output ONLY valid JSON:
{
  "verdict": "AUTHENTIC" | "WRAPPER_STARTUP" | "BUZZWORD_ABUSE" | "CLONE" | "NEEDS_RECONSTRUCTION",
  "authenticity_score": 0-100,
  "detected_issues": ["list of specific problems found"],
  "buzzword_penalty": 0-30,
  "clone_indicators": ["similar products that exist"],
  "differentiation_analysis": "What makes this different (or not)",
  "audit_note": "One-line verdict explanation"
}`;

@Injectable()
export class RealityAuditorAgent {
  private readonly logger = new Logger(RealityAuditorAgent.name);

  constructor(private readonly gemini: GeminiService) {}

  async audit(ideaDescription: string, evidence: RealityEvidencePack): Promise<RealityAuditResult> {
    this.logger.log(`[RealityAuditor] Auditing idea against ${evidence.evidence_sources.length} evidence sources`);

    const prompt = `Perform a reality audit on this startup idea:

IDEA: "${ideaDescription}"

REALITY EVIDENCE:
${evidence.evidence_narrative}

Additional signals:
- GitHub repos found: ${evidence.github_repos_count}
- Clone risk level: ${evidence.clone_risk}
- Known competitors from evidence: ${evidence.top_competitors.join(', ') || 'None identified'}
- Market saturation: ${evidence.saturation_score}/100
- Novelty score: ${evidence.novelty_score}/100

Apply the Reality Auditor protocol. Be adversarial. If saturation is HIGH, say so.
If the idea is a clone of existing products found in evidence, name them.
Output ONLY valid JSON.`;

    try {
      const responseSchema = {
        type: "OBJECT",
        properties: {
          verdict: { type: "STRING", enum: ["AUTHENTIC", "WRAPPER_STARTUP", "BUZZWORD_ABUSE", "CLONE", "NEEDS_RECONSTRUCTION"] },
          authenticity_score: { type: "INTEGER" },
          detected_issues: { type: "ARRAY", items: { type: "STRING" } },
          buzzword_penalty: { type: "INTEGER" },
          clone_indicators: { type: "ARRAY", items: { type: "STRING" } },
          differentiation_analysis: { type: "STRING" },
          audit_note: { type: "STRING" }
        },
        required: ["verdict", "authenticity_score", "detected_issues", "buzzword_penalty", "clone_indicators", "differentiation_analysis", "audit_note"]
      };

      const result = await this.gemini.queryModel(AUDITOR_SYSTEM_PROMPT, prompt, 2, responseSchema, 'FLASH');
      const parsed = JSON.parse(result) as RealityAuditResult;
      
      // Enforce hard reality checks
      if (evidence.clone_risk === 'HIGH' && parsed.verdict === 'AUTHENTIC') {
          parsed.verdict = 'CLONE';
          parsed.authenticity_score = Math.min(parsed.authenticity_score, 40);
          parsed.audit_note = "Enforced CLONE verdict due to HIGH reality clone risk.";
      }

      this.logger.log(`[RealityAuditor] Audit: ${parsed.verdict}, Authenticity: ${parsed.authenticity_score}/100`);
      return parsed;
    } catch (err: any) {
      this.logger.error(`[RealityAuditor] Audit failed: ${err.message}`);
      return {
        verdict: 'AUTHENTIC',
        authenticity_score: 60,
        detected_issues: [],
        buzzword_penalty: 0,
        clone_indicators: [],
        differentiation_analysis: 'Audit unavailable',
        audit_note: 'Reality audit could not complete',
      };
    }
  }
}
