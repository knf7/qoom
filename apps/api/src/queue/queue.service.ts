import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { PipelineService } from '../orchestrator/pipeline/pipeline.service';
import { ScanGateway } from '../websocket/scan.gateway';
import { env } from '../config/env.config';
import { ScanWebSocketEvent } from '@qoom/types';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private scanQueue: Queue | null = null;
  private scanWorker: Worker | null = null;
  private redisClient: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
    private readonly wsGateway: ScanGateway
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing background job queue...');
    
    try {
      this.redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        connectTimeout: 3000,
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis connection error encountered: ${err.message}`);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Successfully connected to Redis instance.');
        this.initializeBullMQ();
      });
    } catch (error) {
      this.logger.error('Failed to configure Redis client.', error);
    }

    // Perform boot recovery for stuck scans
    await this.recoverStuckScans();
  }

  private async recoverStuckScans() {
    this.logger.log('Starting boot recovery scan check for stuck jobs...');
    try {
      const stuckScans = await this.prisma.scan.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        include: { project: true }
      });

      if (stuckScans.length === 0) {
        this.logger.log('No stuck scans detected on boot.');
        return;
      }

      this.logger.warn(`Detected ${stuckScans.length} stuck scans. Initiating recovery & refund protocol...`);

      for (const scan of stuckScans) {
        let parsedPayload: any = {};
        try {
          parsedPayload = scan.payload ? JSON.parse(String(scan.payload)) : {};
        } catch (e) {}

        if (parsedPayload.deductedCredit && scan.project?.userId) {
          await this.prisma.user.update({
            where: { id: scan.project.userId },
            data: { scanCredits: { increment: 1 } }
          }).catch((e: any) => this.logger.error(`Failed to refund user ${scan.project.userId} during recovery`, e));

          parsedPayload.deductedCredit = false;
          this.logger.log(`[Recovery Refund] Refunded 1 credit to user ${scan.project.userId} for stuck scan ${scan.id}`);
        }

        await this.prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: 'FAILED',
            payload: JSON.stringify(parsedPayload),
            errors: JSON.stringify([{ code: 'BOOT_RECOVERY', message: 'تم إعادة تشغيل المخدم أثناء فحص الفكرة.' }])
          }
        }).catch((e: any) => this.logger.error(`Failed to update stuck scan ${scan.id} to FAILED`, e));

        if (scan.projectId) {
          await this.prisma.project.update({
            where: { id: scan.projectId },
            data: { status: 'DRAFT' }
          }).catch((e: any) => this.logger.error(`Failed to reset stuck project ${scan.projectId} status to DRAFT`, e));
        }
      }
      this.logger.log('Boot recovery scan check completed.');
    } catch (err: any) {
      this.logger.error('Failed to complete boot recovery scan check', err);
    }
  }

  private initializeBullMQ() {
    if (this.scanQueue) return;

    const connection = { url: env.REDIS_URL };

    this.scanQueue = new Queue('ScanQueue', { connection });

    // V7 Scalability target: 100 concurrent scans. Setting worker concurrency high.
    // Since execution is Promise.allSettled and non-blocking, we can handle high concurrency.
    this.scanWorker = new Worker(
      'ScanQueue',
      async (job: Job) => {
        const { scanId, projectDescription } = job.data;
        await this.processScanJob(scanId, projectDescription);
      },
      { connection, concurrency: 100 } 
    );

    this.scanWorker.on('completed', (job) => {
      this.logger.log(`[Job Success] Background Scan job ${job.id} finalized successfully.`);
    });

    this.scanWorker.on('failed', async (job, err) => {
      this.logger.error(`[Job Error] Background Scan job ${job?.id} failed: ${err.message}`);
      if (job) {
        // Log to Dead Letter Queue in Postgres for durability
        try {
          await this.prisma.deadLetterQueue.create({
            data: {
              scanId: job.data.scanId,
              payload: JSON.stringify(job.data), // SQLite requires String, not Object
              error: err.message,
              retryCount: job.attemptsMade,
              status: 'FAILED'
            }
          });
          this.logger.log(`Persisted failed job to DeadLetterQueue for scanId: ${job.data.scanId}`);
        } catch (dbErr: any) {
          this.logger.error(`Failed to write to DLQ for scanId: ${job.data.scanId}. Error: ${dbErr.message}`);
        }
      }
    });
  }

  async enqueueScan(scanId: string, projectId: string, projectDescription: string): Promise<void> {
    if (!this.scanQueue) {
      throw new Error('Queue is not initialized.');
    }

    this.logger.log(`Enqueuing scan ${scanId} via BullMQ Queue manager.`);
    await this.scanQueue.add(scanId, { scanId, projectDescription }, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnFail: false, // Keep in redis briefly, DLQ catches permanently
    });
  }

  private async processScanJob(scanId: string, projectDescription: string): Promise<void> {
    this.logger.log(`[Worker Process] Initiating analysis scan: ${scanId}`);

    try {
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'PROCESSING' },
      });

      // The pipeline service now automatically broadcasts events to WebSockets via EventBus
      const orchestratorResult = await this.pipelineService.executeScan(scanId, projectDescription);

      await this.safeFinalizeScan(scanId, orchestratorResult);
      this.logger.log(`[Worker Finalize] Successfully saved scan: ${scanId}`);
      
      this.wsGateway.broadcastToScanRoom(scanId, 'scan:completed', { 
        scanId, 
        result: orchestratorResult 
      });
    } catch (error) {
      this.logger.error(`[Worker Failure] Critical scan worker crash for scan: ${scanId}`, error);

      try {
        const scan = await this.prisma.scan.findUnique({
          where: { id: scanId },
          include: { project: true }
        });
        
        let parsedPayload: any = {};
        try {
          parsedPayload = scan?.payload ? JSON.parse(String(scan.payload)) : {};
        } catch (e) {}

        if (parsedPayload.deductedCredit && scan?.project?.userId) {
          await this.prisma.user.update({
            where: { id: scan.project.userId },
            data: { scanCredits: { increment: 1 } }
          });
          
          parsedPayload.deductedCredit = false;
          await this.prisma.scan.update({
            where: { id: scanId },
            data: { payload: JSON.stringify(parsedPayload) }
          }).catch((e: any) => this.logger.error('Failed to update payload after refund', e));

          this.logger.log(`[Refund] Refunded 1 scan credit to user: ${scan.project.userId} for failed scan: ${scanId}`);
        }
      } catch (refundErr: any) {
        this.logger.error(`Failed to execute scan failure refund for scan: ${scanId}`, refundErr);
      }

      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'FAILED' },
      }).catch((e: any) => this.logger.error('Failed to mark scan status as FAILED', e));

      this.wsGateway.broadcastToScanRoom(scanId, 'scan:failed', {
        scanId,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Strategic analysis scan failed.',
      });

      throw error;
    }
  }

  private async safeFinalizeScan(scanId: string, orchestratorResult: any): Promise<void> {
    const rawDecision = orchestratorResult.verdict || orchestratorResult.decision;
    const dbDecision = rawDecision as 'PASS' | 'FAIL' | 'PIVOT' | 'PARTIAL' | 'RESEARCH_REQUIRED' | 'INTERVIEW_REQUIRED' | 'INTERVIEW_MODE' | 'FAILED';

    const updateData = {
      score: orchestratorResult.score,
      decision: dbDecision,
      confidence: orchestratorResult.confidence,
      summary: orchestratorResult.summary || (orchestratorResult.executiveSummary?.oneLiner),
      recommendation: orchestratorResult.recommendation || (orchestratorResult.synthesis?.content),
      payload: {
        status: orchestratorResult.status,
        meta: orchestratorResult.meta,
        executiveSummary: orchestratorResult.executiveSummary,
        agents: orchestratorResult.agents,
        synthesis: orchestratorResult.synthesis,
        disclaimer: orchestratorResult.disclaimer,
        submittedDescription: orchestratorResult.idea,
        projectTitle: orchestratorResult.meta?.ideaTitle,
        problemInference: orchestratorResult.problemInference || null,
        refinedIdea: orchestratorResult.refinedIdea || null,
        missing_data: [],
        missing_elements: [],
        questions: [],
        realityEvidence: orchestratorResult.realityEvidence || null,
        auditResult: orchestratorResult.auditResult || null,
        iraResult: null,
      }
    };

    await this.prisma.runTransaction(async (tx) => {
      const existingScan = await tx.scan.findUnique({
        where: { id: scanId },
        select: { payload: true }
      });
      let existingPayload: any = {};
      try {
        existingPayload = existingScan?.payload ? JSON.parse(String(existingScan.payload)) : {};
      } catch(e) {}

      let finalStatus = orchestratorResult.status || 'COMPLETED';

      const mergedPayload: any = { ...existingPayload, ...updateData.payload };
      if (existingPayload.problemInference && updateData.payload.problemInference) {
        mergedPayload.problemInference = {
          ...updateData.payload.problemInference,
          confirmed: existingPayload.problemInference.confirmed !== undefined ? existingPayload.problemInference.confirmed : updateData.payload.problemInference.confirmed
        };
      }

      await tx.scan.update({
        where: { id: scanId },
        data: {
          status: finalStatus,
          verdict: dbDecision,
          score: updateData.score,
          decision: updateData.decision as any,
          confidence: updateData.confidence ?? 0,
          summary: updateData.summary,
          recommendation: updateData.recommendation,
          payload: JSON.stringify(mergedPayload),
          errors: orchestratorResult.errors ? JSON.stringify(orchestratorResult.errors) : null,
          missingEvidence: null,
          completedAt: new Date()
        },
      });

      if (dbDecision !== 'FAILED' && orchestratorResult.agentResults && Object.keys(orchestratorResult.agentResults).length > 0) {
        const agentResultsData = Object.entries(orchestratorResult.agentResults).map(
          ([agentType, details]) => {
            const det = details as any;
            return {
              scanId,
              agentType,
              status: det.status || 'SUCCESS',
              score: det.score !== undefined ? det.score : null,
              risks: null,
              opportunities: null,
              recommendation: det.sections?.recommendation?.content || det.recommendation || null,
              analysis: JSON.stringify(det),
              processingTimeMs: det.processingTimeMs || 0,
              errorCode: det.error?.code || null,
              errorMessage: det.error?.message || null,
            };
          }
        );
        await tx.agentResult.createMany({ data: agentResultsData });
      }
    });
  }

  private mapStepToAgentName(step: string): string {
    switch (step) {
      case 'MARKET': return 'MarketAgent';
      case 'COMPETITION': return 'CompetitionAgent';
      case 'MONETIZATION': return 'MonetizationAgent';
      case 'FEASIBILITY': return 'FeasibilityAgent';
      case 'VALIDATION': return 'ValidationAgent';
      default: return 'Orchestrator';
    }
  }
}
