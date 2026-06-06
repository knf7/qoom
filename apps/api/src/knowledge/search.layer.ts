export interface SourcePool {
  primary: string[];
  secondary: string[];
}

export const AGENT_SOURCES: Record<string, SourcePool> = {
  MarketAgent: {
    primary: ['Google Trends', 'Statista', 'GASTAT'],
    secondary: ['McKinsey', 'Bain', 'World Bank']
  },
  CompetitionAgent: {
    primary: ['Crunchbase', 'Product Hunt', 'Snoonua'],
    secondary: ['LinkedIn', 'G2']
  },
  RegulatoryAgent: {
    primary: ['SAMA Sandbox', 'CST Compliance', 'gov.sa'],
    secondary: ['NCA', 'NDMO']
  },
  MonetizationAgent: {
    primary: ['Tamara', 'Tabby', 'mada'],
    secondary: ['Statista FinTech', 'SAMA Reports']
  },
  FeasibilityAgent: {
    primary: ['AWS Riyadh region', 'Absher / Nafath', 'Twaiq Academy'],
    secondary: ['GitHub', 'NPM registry', 'Stack Overflow']
  },
  RiskAgent: {
    primary: ['Local Saudi Market Reports', 'SAMA Regulations'],
    secondary: ['Global Startup Failures DB', 'G2 Risks']
  }
};

export class SearchLayer {
  public static getSourcesPromptInstruction(agentType: string): string {
    const pool = AGENT_SOURCES[agentType];
    if (!pool) return '';

    return `
STRICT EVIDENCE & SOURCES RULE:
You MUST ONLY analyze and claim evidence from the following allowed source pools:
- PRIMARY SOURCES: ${pool.primary.join(', ')}
- SECONDARY SOURCES: ${pool.secondary.join(', ')}

You MUST prioritize Primary Sources. If they don't contain enough data, you may select from Secondary Sources.
List all sources you actually evaluated in the "evidenceUsed" field of your response JSON.
Do NOT cite any source that is not in the list above.
`;
  }
}
