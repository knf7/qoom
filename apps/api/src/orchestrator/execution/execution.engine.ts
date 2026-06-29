import { Injectable, Logger } from '@nestjs/common';
import { MarketAgent } from '../../agents/market.agent';
import { CompetitionAgent } from '../../agents/competition.agent';
import { MonetizationAgent } from '../../agents/monetization.agent';
import { FeasibilityAgent } from '../../agents/feasibility.agent';
import { RiskAgent } from '../../agents/risk.agent';
import { RegulatoryAgent } from '../../agents/regulatory.agent';
import { DebateModeratorAgent } from '../../agents/debate-moderator.agent';
import { ValidatorAgent } from '../../agents/validator.agent';
import { EventBusService } from '../events/event-bus.service';
import { AgentResponse } from '@qoom/types';
import { AIResponseValidator } from '@qoom/security';

export interface AgentResults {
  MarketAgent?: AgentResponse;
  CompetitionAgent?: AgentResponse;
  MonetizationAgent?: AgentResponse;
  FeasibilityAgent?: AgentResponse;
  RiskAgent?: AgentResponse;
  RegulatoryAgent?: AgentResponse;
  DebateModeratorAgent?: AgentResponse;
  ValidatorAgent?: AgentResponse;
}

@Injectable()
export class ParallelExecutionEngine {
  private readonly logger = new Logger(ParallelExecutionEngine.name);

  constructor(
    public readonly marketAgent: MarketAgent,
    public readonly competitionAgent: CompetitionAgent,
    public readonly monetizationAgent: MonetizationAgent,
    public readonly feasibilityAgent: FeasibilityAgent,
    public readonly riskAgent: RiskAgent,
    private readonly regulatoryAgent: RegulatoryAgent,
    private readonly debateModerator: DebateModeratorAgent,
    private readonly validatorAgent: ValidatorAgent,
    private readonly eventBus: EventBusService
  ) {}

  /**
   * Creates an explicit failure result for an agent (fail-closed pattern).
   * Never returns null — always returns a structured error object.
   */
  private buildFailureResult(agentName: string, err: any, elapsed: number): { key: string; res: any; elapsed: number } {
    return {
      key: agentName,
      res: {
        status: 'FAILED',
        score: undefined,
        dimensions: undefined,
        risks: [],
        opportunities: [],
        recommendation: 'فشل الوكيل في إكمال التحليل.',
        analysis: {
          error: 'EXECUTION_ERROR',
          agentType: agentName,
          confidenceLevel: 0,
        },
        error: {
          code: 'EXECUTION_ERROR',
          message: err.message || String(err),
        },
      },
      elapsed,
    };
  }

  /**
   * Omni-Swarm Architecture: Executes active agents concurrently based on Eligibility Gate results.
   */
  async executeAgentsConcurrently(
    bundleString: string,
    scanId: string,
    eligibleAgents: string[] = ['MarketAgent', 'CompetitionAgent', 'MonetizationAgent', 'FeasibilityAgent', 'RiskAgent']
  ): Promise<AgentResults> {
    this.logger.log(`[Swarm] Starting swarm execution for scan: ${scanId} (Active agents: ${eligibleAgents.join(', ')})`);
    
    // Simulate UI starting states so the HUD lights up for eligible agents
    for (const agent of eligibleAgents) {
      this.eventBus.emit('agent.started', { scanId, agentType: agent });
    }

    this.eventBus.emit('scan.log', { scanId, message: '[SYSTEM] إطلاق الوكلاء المؤهلين بالتوازي وتحليل البيانات...' });

    // Map eligible agents to promises
    const agentPromises = eligibleAgents.map(async (agentName) => {
      const start = Date.now();
      let res: any;
      if (agentName === 'MarketAgent') {
        res = await this.marketAgent.analyze(bundleString);
      } else if (agentName === 'CompetitionAgent') {
        res = await this.competitionAgent.analyze(bundleString);
      } else if (agentName === 'MonetizationAgent') {
        res = await this.monetizationAgent.analyze(bundleString);
      } else if (agentName === 'FeasibilityAgent') {
        res = await this.feasibilityAgent.analyze(bundleString);
      } else if (agentName === 'RiskAgent') {
        res = await this.riskAgent.analyze(bundleString);
      } else if (agentName === 'RegulatoryAgent') {
        res = await this.regulatoryAgent.analyze(bundleString);
      } else if (agentName === 'ValidatorAgent') {
        res = await this.validatorAgent.analyze(bundleString);
      } else {
        throw new Error(`Unknown agent: ${agentName}`);
      }

      // Strict validation: will throw AgentValidationError if response fails schema or rules
      const rawText = typeof res === 'string' ? res : JSON.stringify(res);
      const validated = AIResponseValidator.validateAgentResponse(rawText, agentName);

      const elapsed = Date.now() - start;
      return { key: agentName, res: validated, elapsed };
    });

    const settledResults = await Promise.allSettled(agentPromises);
    
    const parsedResults: any = {};
    settledResults.forEach((settled, idx) => {
      const agentName = eligibleAgents[idx];
      if (settled.status === 'fulfilled') {
        const item = settled.value;
        parsedResults[item.key] = item.res;
        this.eventBus.emit('agent.completed', {
          scanId,
          agentType: agentName,
          agentScore: item.res.score ?? 0,
          message: `${agentName} complete.`
        });
        this.eventBus.emit('scan.log', { scanId, message: `[${agentName.replace('Agent', '').toUpperCase()}] تم الانتهاء من التحليل.` });
      } else {
        const err = settled.reason;
        this.logger.error(`${agentName} execution or validation failed:`, err);
        
        // Build a structured failure result to return (fail-closed)
        const failureRes = this.buildFailureResult(agentName, err, 0);
        parsedResults[agentName] = failureRes.res;

        this.eventBus.emit('agent.failed', {
          scanId,
          agentType: agentName,
          error: err.message || 'Execution/validation error'
        });
        this.eventBus.emit('scan.log', { scanId, message: `[${agentName.replace('Agent', '').toUpperCase()}] فشل التحليل أو التحقق من البيانات.` });
      }
    });

    // 3. Debate Layer (only if there are agents to debate and at least one succeeded)
    const hasSuccessfulAgents = Object.values(parsedResults).some((r: any) => r?.status !== 'FAILED');
    if (hasSuccessfulAgents) {
      this.logger.log(`[Swarm] Processing Cross-Agent Debate...`);
      this.eventBus.emit('agent.started', { scanId, agentType: 'DebateModeratorAgent' });
      this.eventBus.emit('agent.debating', { scanId, agentType: 'DebateModeratorAgent', debateTarget: 'ALL', message: 'DebateModerator is validating contradictions...' });
      this.eventBus.emit('scan.log', { scanId, message: '[MODERATOR] جاري حصر التناقضات بين آراء الوكلاء وصياغة القرار الموحد...' });

      let debateResult: any;
      const debateStart = Date.now();
      try {
        const debatePayload = JSON.stringify(parsedResults);
        debateResult = await this.debateModerator.analyze(debatePayload);
      } catch (e: any) {
        this.logger.error(`DebateModeratorAgent execution failed`, e);
        this.eventBus.emit('agent.failed', { scanId, agentType: 'DebateModeratorAgent', error: e.message });
        debateResult = {
          status: 'FAILED',
          score: undefined,
          dimensions: undefined,
          risks: [],
          opportunities: [],
          recommendation: 'فشل الوكيل في إكمال التحليل.',
          analysis: {
            error: 'EXECUTION_ERROR',
            agentType: 'DebateModeratorAgent',
            confidenceLevel: 0,
          },
          error: {
            code: 'EXECUTION_ERROR',
            message: e.message,
          },
        };
      }

      this.eventBus.emit('agent.completed', { scanId, agentType: 'DebateModeratorAgent', agentScore: debateResult.score ?? 0, message: 'Debate concluded.' });
      parsedResults['DebateModeratorAgent'] = debateResult;
    }

    return parsedResults as AgentResults;
  }
}

