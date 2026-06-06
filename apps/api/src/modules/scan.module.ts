import { Module } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';
import { QueueModule } from '../queue/queue.module';
import { GeminiService } from '../ai/gemini.service';

@Module({
  imports: [QueueModule],
  controllers: [ScanController],
  providers: [ScanService, GeminiService],
  exports: [ScanService],
})
export class ScanModule {}
