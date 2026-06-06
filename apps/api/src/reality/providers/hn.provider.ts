import { Logger } from '@nestjs/common';

export interface HNEvidence {
  total_stories: number;
  recent_30d_mentions: number;
  top_stories: { title: string; points: number; url: string }[];
  trend_direction: 'RISING' | 'STABLE' | 'DECLINING';
}

export class HackerNewsProvider {
  private readonly logger = new Logger(HackerNewsProvider.name);
  private readonly ALGOLIA = 'https://hn.algolia.com/api/v1/search';

  async fetch(keywords: string[]): Promise<HNEvidence | null> {
    const query = keywords.slice(0, 3).join(' ');

    try {
      // All-time stories
      const allRes = await fetch(
        `${this.ALGOLIA}?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (!allRes.ok) return null;
      const allData = await allRes.json() as any;

      // Recent 30 days stories
      const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
      const recentRes = await fetch(
        `${this.ALGOLIA}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${cutoff}&hitsPerPage=20`,
        { signal: AbortSignal.timeout(6000) }
      );
      const recentCount = recentRes.ok ? ((await recentRes.json() as any).nbHits ?? 0) : 0;

      const total = allData.nbHits ?? 0;
      const topStories = (allData.hits ?? []).slice(0, 5).map((h: any) => ({
        title: h.title ?? '',
        points: h.points ?? 0,
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      }));

      const trend_direction: HNEvidence['trend_direction'] =
        recentCount > 5 ? 'RISING' : recentCount > 1 ? 'STABLE' : 'DECLINING';

      return { total_stories: total, recent_30d_mentions: recentCount, top_stories: topStories, trend_direction };
    } catch (err: any) {
      this.logger.warn(`[HN] Fetch failed: ${err.message}`);
      return null;
    }
  }
}
