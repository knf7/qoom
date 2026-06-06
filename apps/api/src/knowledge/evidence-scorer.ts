import { Injectable, Logger } from '@nestjs/common';
import { SearchResult } from './providers/search.provider';

export interface ScoredEvidence {
  result: SearchResult;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  justification: string;
}

@Injectable()
export class EvidenceScorer {
  private readonly logger = new Logger(EvidenceScorer.name);

  /**
   * Scores evidence based on institutional authority, freshness, and geographic relevance.
   * High scores given to gov.sa, crunchbase, statista. Low scores to random blogs.
   */
  scoreEvidence(results: SearchResult[]): ScoredEvidence[] {
    this.logger.log(`[EvidenceScorer] Grading ${results.length} evidence sources...`);
    
    return results.map(result => {
      let score = 50; // Base score
      const justifications: string[] = [];

      const urlLower = result.url.toLowerCase();
      const snippetLower = result.snippet.toLowerCase();

      // Institutional Authority
      if (urlLower.includes('.gov.sa')) {
        score += 30;
        justifications.push('Official Saudi Government Source');
      } else if (urlLower.includes('crunchbase.com') || urlLower.includes('magnitt.com') || urlLower.includes('pitchbook.com')) {
        score += 25;
        justifications.push('Institutional Venture Database');
      } else if (urlLower.includes('statista.com') || urlLower.includes('mckinsey.com')) {
        score += 20;
        justifications.push('Tier 1 Global Research Firm');
      } else if (urlLower.includes('medium.com') || urlLower.includes('blogspot') || urlLower.includes('wordpress')) {
        score -= 20;
        justifications.push('Unverified User-Generated Content');
      }

      // Geographic Relevance
      if (snippetLower.includes('saudi') || snippetLower.includes('ksa') || snippetLower.includes('riyadh')) {
        score += 10;
        justifications.push('High Geographic Relevance');
      } else if (snippetLower.includes('usa') || snippetLower.includes('europe')) {
        score -= 10;
        justifications.push('Low Geographic Relevance (Out of bounds proxy)');
      }

      // Freshness (Crude check for recent years in snippet)
      const currentYear = new Date().getFullYear();
      if (snippetLower.includes(currentYear.toString()) || snippetLower.includes((currentYear - 1).toString())) {
        score += 10;
        justifications.push('Recent Data (< 24 months old)');
      }

      // Cap bounds
      score = Math.max(0, Math.min(100, score));

      let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
      if (score >= 80) grade = 'A';
      else if (score >= 65) grade = 'B';
      else if (score >= 50) grade = 'C';
      else if (score >= 35) grade = 'D';

      return {
        result,
        score,
        grade,
        justification: justifications.join(' | ') || 'Baseline source',
      };
    });
  }
}
