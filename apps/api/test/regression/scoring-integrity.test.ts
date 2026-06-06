import { ScoringEngine } from '../../src/scoring/scoring.engine';

export function runScoringIntegrityTests() {
  console.log('--- Running Scoring Integrity Tests ---');
  const scoringEngine = new ScoringEngine();

  // Test 1: Verification of no mutations on input objects
  const originalResults = {
    MarketAgent: {
      status: 'SUCCESS',
      dimensions: { demand: 8, growth: 8, market_size: 8, urgency: 8 }
    },
    FeasibilityAgent: {
      status: 'SUCCESS',
      dimensions: { tech_readiness: 8, mvp_timeline_score: 8, team_availability: 8, dependency_risk: 3 }
    },
    MonetizationAgent: {
      status: 'SUCCESS',
      dimensions: { pricing_power: 8, ltv_to_cac: 8, revenue_predictability: 8, margins: 8 }
    },
    CompetitionAgent: {
      status: 'INSUFFICIENT_EVIDENCE',
      dimensions: { competitor_count: 5, entry_barriers: 5, differentiation: 5, incumbent_threat: 5 }
    }
  };

  const resultsCopy = JSON.parse(JSON.stringify(originalResults));
  const calcResult = scoringEngine.calculateScores(resultsCopy);

  assert(
    JSON.stringify(resultsCopy) === JSON.stringify(originalResults),
    'Scoring engine MUST NOT mutate the input agent results object'
  );

  // Test 2: Skip INSUFFICIENT_EVIDENCE agents from score calculations
  // MarketAgent has score 80 (8+8+8+8 = 32 * 2.5 = 80), FeasibilityAgent score 80, MonetizationAgent score 80.
  // CompetitionAgent is INSUFFICIENT_EVIDENCE.
  // Final score should be 80 since only the 3 successful agents are scored.
  assert(calcResult.finalScore === 80, `Expected finalScore 80, got ${calcResult.finalScore}`);
  assert(calcResult.agentScores.MarketAgent === 80, 'MarketAgent score should be 80');
  assert(calcResult.agentScores.CompetitionAgent === undefined, 'CompetitionAgent should have no score');

  // Test 3: Incomplete dimensions skipped entirely
  const incompleteResults = {
    MarketAgent: {
      status: 'SUCCESS',
      dimensions: { demand: 8, growth: 8, market_size: 8 } // missing urgency
    },
    FeasibilityAgent: {
      status: 'SUCCESS',
      dimensions: { tech_readiness: 8, mvp_timeline_score: 8, team_availability: 8, dependency_risk: 8 } // 8+8+8+(11-8)=27 * 2.5 = 68
    },
    MonetizationAgent: {
      status: 'SUCCESS',
      dimensions: { pricing_power: 8, ltv_to_cac: 8, revenue_predictability: 8, margins: 3 } // 27 * 2.5 = 68
    },
    CompetitionAgent: {
      status: 'SUCCESS',
      dimensions: { competitor_count: 3, entry_barriers: 8, differentiation: 8, incumbent_threat: 8 } // 8+8+8+3 = 27 * 2.5 = 68
    }
  };
  const incompleteCalc = scoringEngine.calculateScores(incompleteResults);
  assert(incompleteCalc.agentScores.MarketAgent === undefined, 'Agent with missing dimensions must be skipped');
  assert(incompleteCalc.finalScore === 68, `Expected finalScore 68, got ${incompleteCalc.finalScore}`);

  // Test 4: Dynamic weight normalization
  // MonetizationAgent (score 50, weight 0.15)
  // RegulatoryAgent (score 100, weight 0.25)
  // FeasibilityAgent (score 100, weight 0.15)
  // Weight sum = 0.15 + 0.25 + 0.15 = 0.55
  // Weighted sum = 50 * 0.15 + 100 * 0.25 + 100 * 0.15 = 7.5 + 25 + 15 = 47.5
  // Expected finalScore = 47.5 / 0.55 = 86.36 -> 86
  const normalizationResults = {
    MonetizationAgent: {
      status: 'SUCCESS',
      dimensions: { pricing_power: 5, ltv_to_cac: 5, revenue_predictability: 5, margins: 5 } // 5*4 = 20 * 2.5 = 50
    },
    RegulatoryAgent: {
      status: 'SUCCESS',
      dimensions: { licensing_difficulty: 1, compliance_cost: 1, data_sovereignty_risk: 1, saudization_impact: 1 } // 11-1 = 10 * 4 = 40 * 2.5 = 100
    },
    FeasibilityAgent: {
      status: 'SUCCESS',
      dimensions: { tech_readiness: 10, mvp_timeline_score: 10, team_availability: 10, dependency_risk: 1 } // 10+10+10+10 = 40 * 2.5 = 100
    }
  };
  const normalizationCalc = scoringEngine.calculateScores(normalizationResults);
  assert(normalizationCalc.finalScore === 86, `Expected normalized finalScore 86, got ${normalizationCalc.finalScore}`);

  // Test 5: Less than 3 successful agents returns null finalScore
  const emptyResults = {
    MarketAgent: {
      status: 'INSUFFICIENT_EVIDENCE',
      dimensions: { demand: 8, growth: 8, market_size: 8, urgency: 8 }
    }
  };
  const emptyCalc = scoringEngine.calculateScores(emptyResults);
  assert(emptyCalc.finalScore === null, 'Final score should be null when there are no valid scored agents');

  console.log('✅ Scoring Integrity Tests Passed!\n');
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}
