import { Module } from '@nestjs/common';
import { RealityIntelligenceService } from './reality-intelligence.service';
import { AiModule } from '../ai/ai.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [AiModule, KnowledgeModule],
  providers: [RealityIntelligenceService],
  exports: [RealityIntelligenceService],
})
export class RealityModule {}
