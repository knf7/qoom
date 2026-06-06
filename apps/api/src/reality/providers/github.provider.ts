import { Logger } from '@nestjs/common';

export interface GitHubEvidence {
  total_repos: number;
  recent_repos: string[];
  top_repos: { name: string; stars: number; url: string }[];
  avg_stars: number;
  growth_velocity: number; // repos created in last 90 days / total
}

export class GitHubProvider {
  private readonly logger = new Logger(GitHubProvider.name);
  private readonly BASE = 'https://api.github.com/search/repositories';

  async fetch(keywords: string[]): Promise<GitHubEvidence | null> {
    const query = keywords.slice(0, 4).join('+');
    const url = `${this.BASE}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'QOOM-V9-Intelligence',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        this.logger.warn(`[GitHub] API returned ${res.status}`);
        return null;
      }

      const data = await res.json() as any;
      const items = data.items ?? [];

      // Fetch recent repos (last 90 days) for velocity
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentUrl = `${this.BASE}?q=${encodeURIComponent(query)}+created:>${ninetyDaysAgo}&sort=created&order=desc&per_page=10`;
      let recentRepos: string[] = [];
      
      try {
        const recentRes = await fetch(recentUrl, {
          headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'QOOM-V9-Intelligence' },
          signal: AbortSignal.timeout(6000),
        });
        if (recentRes.ok) {
          const recentData = await recentRes.json() as any;
          recentRepos = (recentData.items ?? []).slice(0, 5).map((r: any) => r.full_name);
        }
      } catch {}

      const total = data.total_count ?? 0;
      const topRepos = items.slice(0, 5).map((r: any) => ({
        name: r.full_name,
        stars: r.stargazers_count,
        url: r.html_url,
      }));
      const avgStars = items.length > 0
        ? Math.round(items.slice(0, 10).reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0) / Math.min(items.length, 10))
        : 0;

      const growth_velocity = total > 0 ? Math.min(1, (recentRepos.length * 10) / Math.max(total, 1)) : 0;

      return { total_repos: total, recent_repos: recentRepos, top_repos: topRepos, avg_stars: avgStars, growth_velocity };
    } catch (err: any) {
      this.logger.warn(`[GitHub] Fetch failed: ${err.message}`);
      return null;
    }
  }
}
