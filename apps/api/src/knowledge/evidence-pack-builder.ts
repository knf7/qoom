import { Injectable, Logger } from '@nestjs/common';
import { SearchProvider } from './providers/search.provider';
import { EvidenceScorer } from './evidence-scorer';

export interface EvidencePack {
  domain: string;
  regionalBenchmarks: {
    tamEstimate: string;
    growthRateEstimate: string;
  };
  competitorTelemetry: string[];
  liveIntelligence: {
    sources: any[];
    signals: string[];
    confidence: number;
    timestamp: string;
  };
}

@Injectable()
export class EvidencePackBuilder {
  private readonly logger = new Logger(EvidencePackBuilder.name);

  constructor(
    private readonly searchProvider: SearchProvider,
    private readonly evidenceScorer: EvidenceScorer
  ) {}

  /**
   * Compiles real-world data into a structured EvidencePack using actual HTTP calls.
   */
  async buildPack(structuredIdea: any): Promise<EvidencePack> {
    this.logger.log(`[EvidencePackBuilder] Building evidence pack for: ${structuredIdea?.category}`);

    try {
      // Parallel Live Data Retrieval from real search API
      const [marketData, competitorData, regulatoryData] = await Promise.all([
        this.searchProvider.search(`${structuredIdea.category} market size Saudi Arabia`, 'GENERAL'),
        this.searchProvider.search(`${structuredIdea.category} startups competitors in KSA`, 'CRUNCHBASE'),
        this.searchProvider.search(`${structuredIdea.category} licensing requirements Saudi Arabia site:gov.sa`, 'SAUDI_REGULATORY'),
      ]);

      const allEvidence = [...marketData, ...competitorData, ...regulatoryData];
      const scoredEvidence = this.evidenceScorer.scoreEvidence(allEvidence);
      
      const uniqueSources = [...new Set(scoredEvidence.map(e => ({
        domain: e.result.source,
        grade: e.grade,
        justification: e.justification
      })))];
      
      const uniqueSignals = [...new Set(scoredEvidence.map(e => e.result.snippet))];

      // Calculate confidence based on evidence grades
      const averageScore = scoredEvidence.length > 0 
        ? scoredEvidence.reduce((acc, curr) => acc + curr.score, 0) / scoredEvidence.length 
        : 50;
        
      const confidenceScore = Math.min(0.5 + (scoredEvidence.length * 0.05) * (averageScore / 100), 0.95);

      return {
        domain: structuredIdea.category,
        regionalBenchmarks: {
          tamEstimate: this.extractMetric(marketData, 'Billion') || this.extractMetric(marketData, 'SAR') || 'Unknown',
          growthRateEstimate: this.extractMetric(marketData, '%') || 'Unknown',
        },
        competitorTelemetry: competitorData.map(c => `${c.title} - ${c.snippet}`),
        liveIntelligence: {
          sources: uniqueSources,
          signals: uniqueSignals,
          confidence: Number(confidenceScore.toFixed(2)),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error(`[EvidencePackBuilder] Failed to build evidence pack: ${error instanceof Error ? error.message : error}`);
      return {
        domain: structuredIdea?.category || 'unknown',
        regionalBenchmarks: {
          tamEstimate: 'Unknown',
          growthRateEstimate: 'Unknown',
        },
        competitorTelemetry: [],
        liveIntelligence: {
          sources: [],
          signals: [],
          confidence: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private extractMetric(results: any[], symbol: string): string | null {
    for (const r of results) {
      if (r.snippet.includes(symbol)) {
        return r.snippet;
      }
    }
    return null;
  }
}
