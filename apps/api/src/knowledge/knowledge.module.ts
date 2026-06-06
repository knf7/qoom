import { Module, Global } from '@nestjs/common';
import { KnowledgeRetrievalService } from './knowledge.service';
import { SearchProvider } from './providers/search.provider';
import { EvidencePackBuilder } from './evidence-pack-builder';
import { EvidenceScorer } from './evidence-scorer';

@Global()
@Module({
  providers: [KnowledgeRetrievalService, SearchProvider, EvidencePackBuilder, EvidenceScorer],
  exports: [KnowledgeRetrievalService, EvidencePackBuilder, SearchProvider],
})
export class KnowledgeModule {}
