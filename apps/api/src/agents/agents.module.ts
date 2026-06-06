import { Module } from '@nestjs/common';
import { MarketAgent } from './market.agent';
import { CompetitionAgent } from './competition.agent';
import { MonetizationAgent } from './monetization.agent';
import { FeasibilityAgent } from './feasibility.agent';
import { RiskAgent } from './risk.agent';
import { EvidenceValidatorAgent } from './evidence-validator.agent';
import { RegulatoryAgent } from './regulatory.agent';
import { DebateModeratorAgent } from './debate-moderator.agent';
import { ClarityAgent } from './clarity.agent';
import { IdeaReconstructionAgent } from './idea-reconstruction.agent';
import { RealityAuditorAgent } from './reality-auditor.agent';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [
    MarketAgent,
    CompetitionAgent,
    MonetizationAgent,
    FeasibilityAgent,
    RiskAgent,
    EvidenceValidatorAgent,
    RegulatoryAgent,
    DebateModeratorAgent,
    ClarityAgent,
    IdeaReconstructionAgent,
    RealityAuditorAgent,
  ],
  exports: [
    MarketAgent,
    CompetitionAgent,
    MonetizationAgent,
    FeasibilityAgent,
    RiskAgent,
    EvidenceValidatorAgent,
    RegulatoryAgent,
    DebateModeratorAgent,
    ClarityAgent,
    IdeaReconstructionAgent,
    RealityAuditorAgent,
  ],
})
export class AgentsModule {}
