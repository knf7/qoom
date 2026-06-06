import { Logger } from '@nestjs/common';

export interface NpmEvidence {
  total_packages: number;
  top_packages: { name: string; description: string; weekly_downloads?: number }[];
  market_density: 'SPARSE' | 'MODERATE' | 'DENSE';
}

export class NpmProvider {
  private readonly logger = new Logger(NpmProvider.name);

  async fetch(keywords: string[]): Promise<NpmEvidence | null> {
    const query = keywords.slice(0, 3).join(' ');
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=10`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) return null;
      const data = await res.json() as any;

      const total = data.total ?? 0;
      const packages = (data.objects ?? []).slice(0, 5).map((o: any) => ({
        name: o.package?.name ?? '',
        description: o.package?.description?.substring(0, 100) ?? '',
      }));

      const market_density: NpmEvidence['market_density'] =
        total > 500 ? 'DENSE' : total > 100 ? 'MODERATE' : 'SPARSE';

      return { total_packages: total, top_packages: packages, market_density };
    } catch (err: any) {
      this.logger.warn(`[npm] Fetch failed: ${err.message}`);
      return null;
    }
  }
}
