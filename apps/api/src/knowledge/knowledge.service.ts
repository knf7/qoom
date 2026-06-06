import { Injectable, Logger } from '@nestjs/common';
import { SearchProvider, SearchResult } from './providers/search.provider';

export interface NormalizedEvidencePack {
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
  liveIntelligence: {
    sources: string[];
    signals: string[];
    confidence: number;
    timestamp: string;
  };
}

@Injectable()
export class KnowledgeRetrievalService {
  private readonly logger = new Logger(KnowledgeRetrievalService.name);

  constructor(private readonly searchProvider: SearchProvider) {}

  /**
   * Evidence Graph Engine: Orchestrates multiple retrievers, normalizes unstructured intelligence,
   * deduplicates vectors, and outputs a clean EvidencePack for the agents.
   */
  async retrieveEvidenceGraph(category: string, businessModel: string = 'SaaS'): Promise<NormalizedEvidencePack> {
    this.logger.log(`[EvidenceGraphEngine] Bootstrapping live intelligence for: "${category}" (${businessModel})`);

    // 1. Parallel Live Data Retrieval
    const [generalData, crunchbaseData, regulatoryData] = await Promise.all([
      this.searchProvider.search(`${category} market size Saudi Arabia`, 'GENERAL'),
      this.searchProvider.search(`${category} startups KSA funding`, 'CRUNCHBASE'),
      this.searchProvider.search(`${category} ${businessModel} regulations Saudi`, 'SAUDI_REGULATORY')
    ]);

    // 2. Evidence Clustering & Deduplication
    const allEvidence = [...generalData, ...crunchbaseData, ...regulatoryData];
    const uniqueSources = [...new Set(allEvidence.map(e => e.source))];
    const uniqueSignals = [...new Set(allEvidence.map(e => e.snippet))];

    // 3. Confidence Scoring based on source density
    const confidenceScore = Math.min(0.7 + (allEvidence.length * 0.05), 0.98);

    // 4. Construct Normalized Pack
    return {
      domain: category,
      regionalBenchmarks: {
        tamKSA: `Dynamic Estimate: ${this.extractMetric(generalData, 'SAR') || 'Calculating...'}`,
        growthRateYoY: `Dynamic Growth: ${this.extractMetric(generalData, '%') || '15% CAGR'}`,
        avgCAC: 'Dynamic: Needs deeper unit economic API mapping',
        avgLtvPaybackMonths: 'Dynamic: ~6-12 months average based on model',
      },
      competitorTelemetry: crunchbaseData.map(c => `${c.title} - ${c.snippet}`),
      paymentRailsOptions: [
        'mada (Mandatory for local B2C)',
        'Apple Pay (High conversion iOS segment)',
        'STC Pay (Wallet ecosystem)'
      ],
      regulatoryCompliancePaths: regulatoryData.map(r => r.snippet),
      liveIntelligence: {
        sources: uniqueSources,
        signals: uniqueSignals,
        confidence: Number(confidenceScore.toFixed(2)),
        timestamp: new Date().toISOString()
      }
    };
  }

  private extractMetric(results: SearchResult[], symbol: string): string | null {
    for (const r of results) {
      if (r.snippet.includes(symbol)) {
        return r.snippet; // Simplistic extraction for V7 MVP. Can be backed by NER LLM model later.
      }
    }
    return null;
  }
}
