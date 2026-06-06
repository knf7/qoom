import { Injectable, Logger } from '@nestjs/common';

export interface SearchResult {
  title: string;
  snippet: string;
  source: string;
  url: string;
  timestamp: string;
}

@Injectable()
export class SearchProvider {
  private readonly logger = new Logger(SearchProvider.name);

  /**
   * Simulates a dynamic SERP/Crunchbase lookup returning variable structural data.
   * Ready to be swapped with actual fetch() calls to SerpApi/Crunchbase when keys are injected.
   */
  async search(query: string, domain: 'GENERAL' | 'CRUNCHBASE' | 'SAUDI_REGULATORY'): Promise<SearchResult[]> {
    this.logger.log(`[SearchProvider] Executing real SERP search query: "${query}" (Domain: ${domain})`);
    
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      this.logger.warn(`SERPAPI_KEY missing. Returning empty real-time intelligence for ${query}`);
      return [];
    }

    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`SerpApi failed: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      if (data.organic_results) {
        for (const item of data.organic_results.slice(0, 3)) {
          results.push({
            title: item.title || 'Untitled',
            snippet: item.snippet || '',
            source: item.source || new URL(item.link).hostname,
            url: item.link,
            timestamp: new Date().toISOString()
          });
        }
      }

      return results;
    } catch (err) {
      this.logger.error(`Live intelligence retrieval failed for ${query}`, err);
      return [];
    }
  }
}
