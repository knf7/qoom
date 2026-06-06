export interface RealityEvidencePack {
  // Primary Signals
  reality_signal: number;        // 0–100: how real/validated this market is
  saturation_score: number;      // 0–100: how crowded (high = crowded)
  novelty_score: number;         // 0–100: how unique (high = innovative)
  clone_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  trend_direction: 'RISING' | 'STABLE' | 'DECLINING';
  market_momentum: number;       // 0–100
  opportunity_gap_score: number; // 0–100

  // Raw Evidence Counts
  github_repos_count: number;
  github_recent_repos: string[];
  npm_packages_count: number;
  hn_mentions_30d: number;
  producthunt_launches: number;
  stackoverflow_questions: number;

  // Competitor Intelligence
  top_competitors: string[];
  dominant_incumbents: string[];

  // Evidence Confidence
  evidence_confidence: number;   // 0–1
  evidence_sources: string[];
  insufficient_evidence: boolean;
  retrieved_at: string;

  // Narrative summary for agents
  evidence_narrative: string;
}

interface RawEvidence {
  github: any;
  npm: any;
  hn: any;
  so: any;
  ph: any;
  keywords: string[];
  sources: string[];
}

export class RealityScoreEngine {

  compute(raw: RawEvidence): RealityEvidencePack {
    const { github, npm, hn, so, ph, keywords, sources } = raw;
    const confidence = sources.length / 5; // 0 to 1

    // ── Raw Counts ────────────────────────────────────────────────────────────
    const ghRepos = github?.total_repos ?? 0;
    const npmPkgs = npm?.total_packages ?? 0;
    const hnMentions = hn?.recent_30d_mentions ?? 0;
    const phLaunches = ph?.similar_launches ?? 0;
    const soQuestions = so?.question_count ?? 0;

    // ── Saturation Score (0–100: high = very crowded) ────────────────────────
    // Based on: GitHub repos, npm packages, PH launches
    const ghSaturation = Math.min(100, (ghRepos / 5000) * 100);   // 5000 repos = max
    const npmSaturation = Math.min(100, (npmPkgs / 1000) * 100);  // 1000 pkgs = max
    const phSaturation = Math.min(100, (phLaunches / 50) * 100);  // 50 launches = max
    const saturation_score = confidence > 0
      ? Math.round((ghSaturation * 0.5 + npmSaturation * 0.3 + phSaturation * 0.2))
      : 50; // default to mid when no data

    // ── Novelty Score (inverse of saturation + adjustment for uniqueness) ─────
    const novelty_score = Math.max(0, Math.round(100 - saturation_score * 0.7));

    // ── Trend Direction ───────────────────────────────────────────────────────
    const hnTrend = hn?.trend_direction ?? 'STABLE';
    const ghVelocity = github?.growth_velocity ?? 0;
    let trend_direction: RealityEvidencePack['trend_direction'] = 'STABLE';
    if (hnTrend === 'RISING' || ghVelocity > 0.3) trend_direction = 'RISING';
    else if (hnTrend === 'DECLINING' && ghVelocity < 0.1) trend_direction = 'DECLINING';

    // ── Market Momentum (combines HN + SO + velocity) ─────────────────────────
    const hnMomentum = Math.min(100, (hnMentions / 30) * 100);
    const soMomentum = Math.min(100, (so?.recent_questions ?? 0) / 10 * 100);
    const ghMomentum = Math.min(100, ghVelocity * 100);
    const market_momentum = confidence > 0
      ? Math.round(hnMomentum * 0.4 + soMomentum * 0.3 + ghMomentum * 0.3)
      : 30;

    // ── Reality Signal (validates the market exists at all) ───────────────────
    const evidence_exists = ghRepos > 0 || npmPkgs > 0 || hnMentions > 0 || soQuestions > 0;
    const reality_signal = evidence_exists
      ? Math.round(Math.min(100,
          Math.log10(Math.max(ghRepos, 1)) * 15 +
          Math.log10(Math.max(hnMentions + 1, 1)) * 20 +
          Math.log10(Math.max(soQuestions + 1, 1)) * 15 +
          (market_momentum * 0.5)
        ))
      : confidence > 0 ? 10 : 0;

    // ── Clone Risk ────────────────────────────────────────────────────────────
    const clone_risk: RealityEvidencePack['clone_risk'] =
      saturation_score > 70 ? 'HIGH' : saturation_score > 35 ? 'MEDIUM' : 'LOW';

    // ── Opportunity Gap (high saturation + rising trend = gap is closing; low saturation + rising = gap exists) ─
    const opportunity_gap_score = trend_direction === 'RISING' && saturation_score < 40
      ? Math.round(80 - saturation_score * 0.5)
      : trend_direction === 'RISING' && saturation_score < 70
      ? Math.round(50 - saturation_score * 0.3)
      : Math.round(Math.max(10, 40 - saturation_score * 0.3));

    // ── Competitor extraction ─────────────────────────────────────────────────
    const top_competitors = [
      ...(github?.top_repos ?? []).slice(0, 3).map((r: any) => r.name),
      ...(npm?.top_packages ?? []).slice(0, 2).map((p: any) => p.name),
    ].filter(Boolean).slice(0, 5);

    const dominant_incumbents = (github?.top_repos ?? [])
      .filter((r: any) => r.stars > 500)
      .slice(0, 3)
      .map((r: any) => r.name);

    // ── Evidence Narrative (injected into all agent prompts) ──────────────────
    const insufficient_evidence = confidence < 0.4;
    const narrative = this.buildNarrative({
      keywords, ghRepos, npmPkgs, hnMentions, soQuestions, phLaunches,
      saturation_score, novelty_score, trend_direction, market_momentum,
      top_competitors, sources, insufficient_evidence, confidence,
    });

    return {
      reality_signal: Math.max(0, Math.min(100, reality_signal)),
      saturation_score: Math.max(0, Math.min(100, saturation_score)),
      novelty_score: Math.max(0, Math.min(100, novelty_score)),
      clone_risk,
      trend_direction,
      market_momentum: Math.max(0, Math.min(100, market_momentum)),
      opportunity_gap_score: Math.max(0, Math.min(100, opportunity_gap_score)),
      github_repos_count: ghRepos,
      github_recent_repos: github?.recent_repos ?? [],
      npm_packages_count: npmPkgs,
      hn_mentions_30d: hnMentions,
      producthunt_launches: phLaunches,
      stackoverflow_questions: soQuestions,
      top_competitors,
      dominant_incumbents,
      evidence_confidence: confidence,
      evidence_sources: sources,
      insufficient_evidence,
      retrieved_at: new Date().toISOString(),
      evidence_narrative: narrative,
    };
  }

  private buildNarrative(p: any): string {
    if (p.insufficient_evidence) {
      return `⚠️ INSUFFICIENT EXTERNAL EVIDENCE DETECTED. Only ${p.sources.length}/5 evidence sources responded. Confidence: ${Math.round(p.confidence * 100)}%. All agent scores must be penalized. Do not fabricate certainty. Keywords searched: [${p.keywords.join(', ')}].`;
    }

    return `REALITY EVIDENCE PACK [${new Date().toISOString()}]:
Keywords analyzed: [${p.keywords.join(', ')}]
Evidence sources: [${p.sources.join(', ')}] (${p.sources.length}/5 responded)

MARKET EXISTENCE:
- GitHub repositories found: ${p.ghRepos.toLocaleString()}
- npm packages found: ${p.npmPkgs.toLocaleString()}  
- Hacker News mentions (30d): ${p.hnMentions}
- Stack Overflow questions: ${p.soQuestions}
- Product Hunt launches: ${p.phLaunches}

MARKET SIGNALS:
- Saturation: ${p.saturation_score}/100 (${p.saturation_score > 70 ? 'VERY HIGH — crowded market' : p.saturation_score > 40 ? 'MODERATE competition' : 'LOW — potential opportunity'})
- Novelty: ${p.novelty_score}/100
- Trend: ${p.trend_direction}
- Market Momentum: ${p.market_momentum}/100

TOP KNOWN COMPETITORS: ${p.top_competitors.length > 0 ? p.top_competitors.join(', ') : 'None found in evidence scan'}

AGENT INSTRUCTION: You MUST reference this evidence in your analysis. Do not invent market data. If saturation is HIGH, you must reflect that in your scoring. Do not give optimistic scores that contradict the evidence above.`;
  }
}
