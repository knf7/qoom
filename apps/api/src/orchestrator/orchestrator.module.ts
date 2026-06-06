import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline/pipeline.service';
import { ClarityEngine } from './clarity/clarity.engine';
import { ParallelExecutionEngine } from './execution/execution.engine';
import { AgentsModule } from '../agents/agents.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AiModule } from '../ai/ai.module';
import { RealityModule } from '../reality/reality.module';
import { EventsModule } from './events/events.module';
import { ScoringEngine } from '../scoring/scoring.engine';
import { EligibilityGate } from './eligibility/eligibility.gate';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [AgentsModule, KnowledgeModule, AiModule, RealityModule, EventsModule, DatabaseModule],
  providers: [PipelineService, ClarityEngine, ParallelExecutionEngine, ScoringEngine, EligibilityGate],
  exports: [PipelineService, ScoringEngine, EligibilityGate],
})
export class OrchestratorModule {}
