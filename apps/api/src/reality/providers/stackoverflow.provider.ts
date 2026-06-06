import { Logger } from '@nestjs/common';

export interface StackOverflowEvidence {
  question_count: number;
  recent_questions: number;
  has_dedicated_tag: boolean;
  demand_signal: 'WEAK' | 'MODERATE' | 'STRONG';
}

export class StackOverflowProvider {
  private readonly logger = new Logger(StackOverflowProvider.name);

  async fetch(keywords: string[]): Promise<StackOverflowEvidence | null> {
    const query = keywords.slice(0, 3).join(' ');
    const encoded = encodeURIComponent(query);

    try {
      const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=${encoded}&site=stackoverflow&pagesize=10&key=`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) return null;
      const data = await res.json() as any;

      // Recent 90 days
      const cutoff = Math.floor(Date.now() / 1000) - 90 * 24 * 3600;
      const recentUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=creation&q=${encoded}&site=stackoverflow&pagesize=25&fromdate=${cutoff}`;
      let recentCount = 0;
      try {
        const rRes = await fetch(recentUrl, { signal: AbortSignal.timeout(6000) });
        if (rRes.ok) recentCount = ((await rRes.json() as any).items ?? []).length;
      } catch {}

      const total = (data.items ?? []).length;
      const demand_signal: StackOverflowEvidence['demand_signal'] =
        total > 20 ? 'STRONG' : total > 5 ? 'MODERATE' : 'WEAK';

      return {
        question_count: data.total ?? total,
        recent_questions: recentCount,
        has_dedicated_tag: total > 30,
        demand_signal,
      };
    } catch (err: any) {
      this.logger.warn(`[StackOverflow] Fetch failed: ${err.message}`);
      return null;
    }
  }
}
