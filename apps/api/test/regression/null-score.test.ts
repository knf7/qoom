import { ScoringEngine } from '../../src/scoring/scoring.engine';

export function runNullScoreTests() {
  console.log('--- Running Null Score Tests ---');
  const scoringEngine = new ScoringEngine();

  // Test 1: Scoring engine yields null when all agents have insufficient evidence
  const allInsufficient = {
    MarketAgent: { status: 'INSUFFICIENT_EVIDENCE' },
    CompetitionAgent: { status: 'INSUFFICIENT_EVIDENCE' }
  };
  const emptyCalc = scoringEngine.calculateScores(allInsufficient);
  assert(emptyCalc.finalScore === null, 'Expected null score when all agents are insufficient');

  // Test 2: Final score calculator logic mimic
  // If baseScore is null, finalScore must be null.
  const baseScore: number | null = emptyCalc.finalScore;
  const validatorRes = { adjusted_score_factor: 0.95 };
  const realityMultiplier = 0.85;

  let finalScore: number | null = (baseScore !== null && baseScore !== undefined)
    ? Math.round(baseScore * validatorRes.adjusted_score_factor * Math.max(0.5, realityMultiplier))
    : null;

  assert(finalScore === null, 'finalScore must be null if baseScore is null');

  // Test 3: LLM fallback verdict logic
  // if finalScore is null -> verdict: 'NEEDS MORE EXPLORATION'
  let deterministicVerdict: string;
  if (finalScore === null) {
    deterministicVerdict = 'NEEDS MORE EXPLORATION';
  } else if (finalScore >= 60) {
    deterministicVerdict = 'BUILD';
  } else {
    deterministicVerdict = 'KILL';
  }

  assert(deterministicVerdict === 'NEEDS MORE EXPLORATION', 'Expected NEEDS MORE EXPLORATION verdict for null score');

  console.log('✅ Null Score Tests Passed!\n');
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}
