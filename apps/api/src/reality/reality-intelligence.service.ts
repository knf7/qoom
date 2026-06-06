import { Injectable, Logger } from '@nestjs/common';
import { RealityScoreEngine, RealityEvidencePack } from './reality-score.engine';
import { GeminiService } from '../ai/gemini.service';
import { SearchProvider } from '../knowledge/providers/search.provider';

@Injectable()
export class RealityIntelligenceService {
  private readonly logger = new Logger(RealityIntelligenceService.name);
  private readonly scoreEngine = new RealityScoreEngine();

  constructor(
    private readonly gemini: GeminiService,
    private readonly searchProvider: SearchProvider
  ) {}

  /**
   * V9: Reality Intelligence MCP-style Integration
   * Dynamically generates search queries, executes real web searches, and uses LLM to synthesize Market Reality.
   */
  async gatherEvidence(ideaDescription: string, scanId: string): Promise<RealityEvidencePack> {
    this.logger.log(`[RIL] Initiating V9 Reality Search for scan ${scanId}`);
    const startTime = Date.now();

    // 1. Generate optimal search queries (Market Saturation, Competitors, Alternatives)
    const queryPrompt = `You are a Venture Capital OS Search Agent. Based on the following startup idea, generate exactly 3 highly specific search engine queries to find: 
1. Direct competitors or existing exact startups.
2. Market size, saturation, or demand trends.
3. Open-source alternatives or developer traction (GitHub/NPM/Reddit).

Idea: ${ideaDescription}

Return ONLY a valid JSON array of 3 strings. Example: ["direct competitor to X startup", "market size of Y", "github open source Y alternative"]`;
    
    let queries: string[] = [];
    try {
      const queriesStr = await this.gemini.queryModel(
        "Generate Search Queries JSON array", 
        queryPrompt, 
        2, 
        { type: "ARRAY", items: { type: "STRING" } }, 
        'FLASH'
      );
      queries = JSON.parse(queriesStr);
      if (!Array.isArray(queries) || queries.length < 1) throw new Error("Invalid format");
      queries = queries.slice(0, 3);
    } catch (e) {
      this.logger.warn(`[RIL] Fallback query generation used.`);
      const base = ideaDescription.split(' ').slice(0, 5).join(' ');
      queries = [`${base} startup competitors`, `${base} market trends`, `${base} github alternatives`];
    }
    
    this.logger.log(`[RIL] Search queries generated: ${JSON.stringify(queries)}`);

    // 2. Execute parallel searches
    const searchPromises = queries.map(q => this.searchProvider.search(q, 'GENERAL').catch(() => []));
    const searchResultsArrays = await Promise.all(searchPromises);
    const combinedSearchResults = searchResultsArrays.flat().filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i); // Unique results
    
    this.logger.log(`[RIL] Retrieved ${combinedSearchResults.length} real search results.`);

    // 3. Extract Intelligence via LLM
    const extractPrompt = `You are the QOOM V9 Reality Score Engine. Analyze the following real-world search results for a startup idea and extract the required metrics. Be brutally honest. Do not invent data. If you see many competitors, saturation is high.

Idea: ${ideaDescription}
Real Search Results:
${combinedSearchResults.map(r => `- [${r.title}](${r.url}): ${r.snippet}`).join('\n')}

Return a JSON object matching this schema. Estimate the numbers reasonably based on the density of search results.`;

    let extractedData: any = null;
    try {
      const extStr = await this.gemini.queryModel(
        "Extract Market Metrics from Search Results", 
        extractPrompt, 
        2, 
        { 
          type: "OBJECT", 
          properties: {
            github_repos_count: { type: "INTEGER", description: "Estimated number of github repos based on results" },
            npm_packages_count: { type: "INTEGER", description: "Estimated number of packages" },
            hn_mentions_30d: { type: "INTEGER", description: "Estimated HackerNews/Reddit mentions" },
            so_questions: { type: "INTEGER", description: "Estimated StackOverflow/Forum questions" },
            ph_launches: { type: "INTEGER", description: "Estimated ProductHunt launches" },
            top_competitors: { type: "ARRAY", items: { type: "STRING" }, description: "List of top competitor names found" },
            trend_direction: { type: "STRING", enum: ["RISING", "STABLE", "DECLINING"] }
          },
          required: ["github_repos_count", "top_competitors", "trend_direction"]
        },
        'FLASH'
      );
      extractedData = JSON.parse(extStr);
    } catch (e) {
      this.logger.warn(`[RIL] Failed to extract structured metrics via LLM, using zero fallbacks (fail-closed).`, e);
      extractedData = {
        github_repos_count: 0,
        npm_packages_count: 0,
        hn_mentions_30d: 0,
        so_questions: 0,
        ph_launches: 0,
        top_competitors: combinedSearchResults.slice(0, 3).map(r => r.title),
        trend_direction: 'UNKNOWN',
        growth_velocity: 0,
        sources: [],
        evidence_confidence: 0
      };
    }

    // Map back to RawEvidence for the legacy score engine
    const rawEvidence = {
      github: { 
        total_repos: extractedData.github_repos_count || 0, 
        top_repos: (extractedData.top_competitors || []).map((c: string) => ({ name: c, stars: 100 })),
        growth_velocity: extractedData.trend_direction === 'RISING' ? 0.5 : 0.1
      },
      npm: { total_packages: extractedData.npm_packages_count || 0, top_packages: [] },
      hn: { recent_30d_mentions: extractedData.hn_mentions_30d || 0, trend_direction: extractedData.trend_direction || 'STABLE' },
      so: { question_count: extractedData.so_questions || 0, recent_questions: extractedData.so_questions ? Math.floor(extractedData.so_questions/4) : 0 },
      ph: { similar_launches: extractedData.ph_launches || 0 },
      keywords: queries,
      sources: combinedSearchResults.length > 0 ? ['serpapi', 'gemini_intelligence'] : []
    };

    const elapsed = Date.now() - startTime;
    this.logger.log(`[RIL] Evidence gathered in ${elapsed}ms for scan ${scanId}`);

    try {
      return this.scoreEngine.compute(rawEvidence as any);
    } catch (computeErr) {
      this.logger.error(`[RIL] Evidence pack builder failed for scan ${scanId}`, computeErr);
      throw computeErr;
    }
  }
}
