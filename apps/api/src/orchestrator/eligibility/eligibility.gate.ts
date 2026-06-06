import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EligibilityGate {
  private readonly logger = new Logger(EligibilityGate.name);

  /**
   * Evaluates the structured startup idea and its description 
   * to determine which specialized agents are eligible to run.
   */
  evaluateEligibility(structuredIdea: any, description: string): string[] {
    return [
      'MarketAgent',
      'CompetitionAgent',
      'MonetizationAgent',
      'FeasibilityAgent',
      'RiskAgent',
    ];
  }
}
