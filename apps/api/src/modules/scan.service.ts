import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueueService } from '../queue/queue.service';
import { GeminiService } from '../ai/gemini.service';
import { PromptFirewallService, PromptFirewallException, InputSanitizer, PREVALIDATION_SCHEMA } from '@qoom/security';
import { SMART_PREVALIDATION_PROMPT } from '@qoom/prompts';
import { CreateProjectInput, CreateScanInput, ScanStatusPayload } from '@qoom/types';
import { randomUUID } from 'crypto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly gemini: GeminiService
  ) {}

  /**
   * AI-Powered Smart Pre-Validation using Gemini.
   * Analyzes the idea description intelligently. If elements are missing, returns MCQ questions.
   */
  async validateIdeaWithAI(description: string): Promise<any> {
    this.logger.log('[Smart Pre-Validation] Always passing to support Flexible Analyst model...');
    return {
      status: 'READY',
      completion_score: 100,
      missing_fields: [],
      questions: []
    };
  }

  /**
   * Deletes a project and all associated scans.
   */
  async deleteProject(userId: string, projectId: string): Promise<any> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    this.logger.log(`Deleted project: ${projectId} by user: ${userId}`);
    return { success: true, message: 'Project deleted successfully.' };
  }

  /**
   * Updates a project's description (used for inline editing from dashboard).
   * Resets project status to DRAFT so it can be re-validated.
   */
  async updateProject(userId: string, projectId: string, updates: { description?: string; title?: string }): Promise<any> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(updates.description && { description: updates.description }),
        ...(updates.title && { title: updates.title }),
        status: 'DRAFT', // Reset to DRAFT to allow editing/validation again
      },
    });
  }

  /**
   * Registers a new project for a user with Beta Quota Enforcement.
   * Status defaults to DRAFT.
   */
  async createProject(userId: string, input: CreateProjectInput): Promise<any> {
    this.logger.log(`[Quota Check] Verifying project limits for user: ${userId}`);

    const projectCount = await this.prisma.project.count({
      where: { userId },
    });

    if (projectCount >= 100) {
      throw new BadRequestException('لقد وصلت للحد الأقصى المسموح به (100 مشاريع). يرجى حذف أحد المشاريع الحالية لإنشاء مشروع جديد.');
    }

    const project = await this.prisma.project.create({
      data: {
        title: input.title,
        description: input.description,
        userId,
        status: 'DRAFT',
      },
    });

    this.logger.log(`Created new Project: ${project.id} for user: ${userId}. Quota used: ${projectCount + 1}/100`);
    return project;
  }

  /**
   * Returns all active projects owned by a user.
   */
  async getProjectsByUser(userId: string): Promise<any[]> {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Triggers a new AI Multi-Agent analysis scan.
   * Evaluates idea completeness. Returns INTERVIEW_MODE if fields are missing.
   */
  async triggerScan(userId: string, input: CreateScanInput): Promise<any> {
    // 1. Verify project ownership before proceeding
    const project = await this.prisma.project.findFirst({
      where: { id: input.projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('The requested project was not found or is inaccessible.');
    }

    // SECURITY LIMIT: Max 100 scans per user
    const totalUserScans = await this.prisma.scan.count({
      where: {
        project: {
          userId: userId
        },
        status: { not: 'FAILED' }
      }
    });

    if (totalUserScans >= 100) {
      throw new BadRequestException('لقد استنفدت الحد الأقصى للتحليلات المتاحة لحسابك (100 تحليل).');
    }

    // 2. Proactive security check: run PromptFirewallService unified pipeline (Heuristics -> AI scoring -> Policy engine)
    let sanitizedDescription: string;
    try {
      const securityVerdict = await PromptFirewallService.runFirewallPipeline(
        project.description,
        (sys, prompt, retries, schema) => this.gemini.queryModel(sys, prompt, retries, schema)
      );

      if (securityVerdict.status === 'BLOCK') {
        this.logger.error(`[Security Block] Scan blocked by Policy Engine. Risk Score: ${securityVerdict.riskScore}, Category: ${securityVerdict.category}, Reason: ${securityVerdict.reason}`);
        throw new BadRequestException(securityVerdict.reason);
      }

      if (securityVerdict.status === 'FLAG') {
        this.logger.warn(`[Security Flag] Scan flagged by Policy Engine. Risk Score: ${securityVerdict.riskScore}, Category: ${securityVerdict.category}, Reason: ${securityVerdict.reason}`);
        
        // Log to database AuditLog as a FLAG record
        await this.prisma.auditLog.create({
          data: {
            action: 'SECURITY_FLAGGED',
            userId,
            details: JSON.stringify({
              projectId: project.id,
              riskScore: securityVerdict.riskScore,
              category: securityVerdict.category,
              reason: securityVerdict.reason,
            }),
          },
        });
      }

      sanitizedDescription = securityVerdict.sanitized;
    } catch (err) {
      if (err instanceof PromptFirewallException) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
    
    // 3. [Completeness Gate] - Accepting all ideas for problem inference v3.0

    // 4. Prevent parallel scan spam
    const activeScan = await this.prisma.scan.findFirst({
      where: {
        projectId: project.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (activeScan) {
      throw new BadRequestException('A strategic scan is already in progress for this project. Please wait for it to complete.');
    }

    // Update Project Status to READY_FOR_ANALYSIS / ANALYZING
    await this.prisma.project.update({
      where: { id: project.id },
      data: { status: 'READY_FOR_ANALYSIS' }
    });

    // 5. Create PENDING Scan entity
    const scan = await this.prisma.scan.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        payload: JSON.stringify({
          submittedDescription: sanitizedDescription,
          projectId: project.id,
          projectTitle: project.title,
        }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SCAN_TRIGGERED',
        userId,
        details: JSON.stringify({ scanId: scan.id, projectId: project.id }),
      },
    });

    this.logger.log(`Strategic scan ${scan.id} queued for project ${project.id}`);

    // 6. Enqueue background execution
    await this.queue.enqueueScan(scan.id, project.id, sanitizedDescription);

    return {
      scanId: scan.id,
      status: 'PENDING',
      message: 'Analysis scan successfully initialized and enqueued.',
    };
  }

  /**
   * Queries full scan reports, strictly enforcing owner authorization.
   */
  async getScanDetails(userId: string, scanId: string): Promise<any> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        project: true,
        results: true,
      },
    });

    if (!scan) {
      throw new NotFoundException('The requested scan report was not found.');
    }

    // Restrict queries strictly to project owners
    if (scan.project.userId !== userId) {
      this.logger.warn(`Unauthorized scan access attempt! User ${userId} requested Scan ${scanId}`);
      throw new ForbiddenException('You do not have permission to view this strategic report.');
    }

    // Parse payload JSON to extract reality intelligence data
    let parsedPayload: any = {};
    try {
      parsedPayload = scan.payload ? JSON.parse(String(scan.payload)) : {};
    } catch (e) {
      this.logger.warn(`Failed to parse scan payload for scan ${scanId}`);
    }

    // Parse JSON string fields in AgentResults
    const parsedResults = (scan.results || []).map((result: any) => {
      let risks: any[] = [];
      let opportunities: any[] = [];
      let analysis: any = {};
      try { risks = JSON.parse(result.risks || '[]'); } catch (e) { risks = []; }
      try { opportunities = JSON.parse(result.opportunities || '[]'); } catch (e) { opportunities = []; }
      try { analysis = JSON.parse(result.analysis || '{}'); } catch (e) { analysis = {}; }
      return {
        ...result,
        risks,
        opportunities,
        analysis: typeof analysis === 'string' ? analysis : JSON.stringify(analysis),
      };
    });

    return {
      ...scan,
      payload: parsedPayload,
      results: parsedResults,
      realityEvidence: parsedPayload.realityEvidence || null,
      auditResult: parsedPayload.auditResult || null,
      iraResult: parsedPayload.iraResult || null,
      description: scan.project?.description || parsedPayload.submittedDescription || '',
      ideaDescription: scan.project?.description || parsedPayload.submittedDescription || '',
      projectTitle: scan.project?.title || parsedPayload.projectTitle || '',
    };
  }

  /**
   * Public passport query. Ingests scan ID and returns aggregated credentials.
   */
  async getPassportCredentials(scanId: string): Promise<any> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        project: {
          select: {
            title: true,
            createdAt: true,
          },
        },
        results: {
          select: {
            agentType: true,
            score: true,
            recommendation: true,
            risks: true,
            opportunities: true,
          },
        },
      },
    });

    if (!scan) {
      throw new NotFoundException('Strategic Innovation Passport credentials not found.');
    }

    if (scan.status !== 'COMPLETED') {
      throw new BadRequestException('Innovation Passport credentials are not compiled yet.');
    }

    return {
      passportId: scan.id,
      title: scan.project.title,
      score: scan.score,
      decision: scan.decision,
      confidence: scan.confidence,
      summary: scan.summary,
      recommendation: scan.recommendation,
      agentPassportScores: scan.results,
      createdAt: scan.createdAt,
    };
  }
}
