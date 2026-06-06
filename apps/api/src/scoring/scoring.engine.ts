import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ScoringEngine {
  private readonly logger = new Logger(ScoringEngine.name);

  // Default weights
  private readonly weights: Record<string, number> = {
    MarketAgent: 0.15,
    CompetitionAgent: 0.15,
    MonetizationAgent: 0.15,
    FeasibilityAgent: 0.15,
    RiskAgent: 0.15,
    RegulatoryAgent: 0.25
  };

  /**
   * Dimension calculation formulas per agent.
   * Each returns a score 0-100 from validated dimensions, or null if any dimension is missing.
   * NO fallback values — missing dimension = invalid agent.
   */
  private readonly formulas: Record<string, (d: any) => number | null> = {
    MarketAgent: (d) => {
      if (d.demand == null || d.growth == null || d.market_size == null || d.urgency == null) return null;
      return Math.round((d.demand + d.growth + d.market_size + d.urgency) * 2.5);
    },
    CompetitionAgent: (d) => {
      if (d.competitor_count == null || d.entry_barriers == null || d.differentiation == null || d.incumbent_threat == null) return null;
      return Math.round(((11 - d.competitor_count) + d.entry_barriers + d.differentiation + (11 - d.incumbent_threat)) * 2.5);
    },
    MonetizationAgent: (d) => {
      if (d.pricing_power == null || d.ltv_to_cac == null || d.revenue_predictability == null || d.margins == null) return null;
      return Math.round((d.pricing_power + d.ltv_to_cac + d.revenue_predictability + d.margins) * 2.5);
    },
    FeasibilityAgent: (d) => {
      if (d.tech_readiness == null || d.mvp_timeline_score == null || d.team_availability == null || d.dependency_risk == null) return null;
      return Math.round((d.tech_readiness + d.mvp_timeline_score + d.team_availability + (11 - d.dependency_risk)) * 2.5);
    },
    RiskAgent: (d) => {
      if (d.operational_risk == null || d.financial_risk == null || d.execution_risk == null || d.adoption_risk == null) return null;
      return Math.round(((11 - d.operational_risk) + (11 - d.financial_risk) + (11 - d.execution_risk) + (11 - d.adoption_risk)) * 2.5);
    },
    RegulatoryAgent: (d) => {
      if (d.licensing_difficulty == null || d.compliance_cost == null || d.data_sovereignty_risk == null || d.saudization_impact == null) return null;
      return Math.round(((11 - d.licensing_difficulty) + (11 - d.compliance_cost) + (11 - d.data_sovereignty_risk) + (11 - d.saudization_impact)) * 2.5);
    },
  };

  /**
   * Calculates deterministic scores for each agent based on their 1-10 dimensions,
   * then computes the final aggregated score dynamically based on active agents and weights.
   *
   * Fail-Closed Rules:
   * - NO mutation of input objects
   * - Agents with status === 'INSUFFICIENT_EVIDENCE' are EXCLUDED (not scored as 0)
   * - Missing dimensions = invalid agent (skipped entirely)
   * - If 0 successful agents → finalScore: null
   */
  calculateScores(agentResults: any): { finalScore: number | null; agentScores: Record<string, number> } {
    this.logger.log('[ScoringEngine] Commencing deterministic venture score calculations...');
    const agentScores: Record<string, number> = {};

    // 1. Calculate individual agent scores — NO mutation of agentResults
    for (const agentName of Object.keys(this.weights)) {
      const agentData = agentResults[agentName];
      if (!agentData) continue;

      // Skip INSUFFICIENT_EVIDENCE agents entirely — do NOT score them as 0
      if (agentData.status === 'INSUFFICIENT_EVIDENCE') {
        this.logger.warn(`[ScoringEngine] ${agentName} returned INSUFFICIENT_EVIDENCE — excluded from scoring.`);
        continue;
      }

      // Skip agents without dimensions
      if (!agentData.dimensions) {
        this.logger.warn(`[ScoringEngine] ${agentName} has no dimensions — excluded from scoring.`);
        continue;
      }

      // Calculate score using formula — returns null if any dimension is missing
      const formula = this.formulas[agentName];
      if (!formula) continue;

      const score = formula(agentData.dimensions);
      if (score == null) {
        this.logger.warn(`[ScoringEngine] ${agentName} has incomplete dimensions — excluded from scoring.`);
        continue;
      }

      agentScores[agentName] = score;
    }

    // 2. Dynamic Weight Aggregation — only over agents that produced valid scores
    const activeAgentKeys = Object.keys(agentScores);

    // FAIL-CLOSED: Less than 3 successful agents = no final score (null)
    if (activeAgentKeys.length < 3) {
      this.logger.warn(`[ScoringEngine] Less than 3 successful agents (${activeAgentKeys.length}) — returning null finalScore (fail-closed).`);
      return { finalScore: null, agentScores };
    }

    let weightedSum = 0;
    let weightSum = 0;

    for (const key of activeAgentKeys) {
      const score = agentScores[key];
      const weight = this.weights[key] || 0;
      weightedSum += score * weight;
      weightSum += weight;
    }

    // weightSum is guaranteed > 0 because activeAgentKeys.length > 0 and all have weights
    const finalScore = Math.round(weightedSum / weightSum);
    this.logger.log(`[ScoringEngine] Deterministic calculation complete. Final Score: ${finalScore}/100 (Active agents: ${activeAgentKeys.length}, Summed Weight: ${Math.round(weightSum * 100)}%)`);

    return {
      finalScore,
      agentScores
    };
  }
}
