import { Logger } from '@nestjs/common';

export interface ProductHuntEvidence {
  similar_launches: number;
  recent_launches: { name: string; tagline: string; votes: number }[];
  launch_frequency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class ProductHuntProvider {
  private readonly logger = new Logger(ProductHuntProvider.name);

  async fetch(keywords: string[]): Promise<ProductHuntEvidence | null> {
    // Use PH's public RSS feed parsed as XML, or their public search endpoint
    // Product Hunt doesn't require auth for basic topic search via their public API v2 (no key needed for read)
    const query = keywords.slice(0, 2).join(' ');
    
    try {
      // Use the public PH search (no API key needed for basic search)
      const url = `https://www.producthunt.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; QOOM-V9/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return null;
      const html = await res.text();

      // Extract product count from page meta/title
      const countMatch = html.match(/(\d+)\s+products?\s+found/i) 
        || html.match(/showing\s+(\d+)/i)
        || html.match(/"totalCount"\s*:\s*(\d+)/);
      const similar_launches = countMatch ? parseInt(countMatch[1]) : 
        (html.includes('product-item') ? html.split('product-item').length - 1 : 0);

      const launch_frequency: ProductHuntEvidence['launch_frequency'] =
        similar_launches > 20 ? 'HIGH' : similar_launches > 5 ? 'MEDIUM' : 'LOW';

      return {
        similar_launches,
        recent_launches: [],
        launch_frequency,
      };
    } catch (err: any) {
      this.logger.warn(`[ProductHunt] Fetch failed: ${err.message}`);
      return null;
    }
  }
}
