import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [OrchestratorModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
