import { z } from 'zod';

// ==========================================
// V2.0 State Machine (Single Source of Truth)
// ==========================================
export { ProjectStatus, ScanStatus, ScanVerdict, AgentExecStatus, IRAStatus } from './state-machine';
export { isValidProjectTransition, isValidScanTransition, mapScanStatusToProjectStatus } from './state-machine';
export type { ProjectStatus as ProjectStatusType, ScanStatus as ScanStatusType, ScanVerdict as ScanVerdictType, AgentExecStatus as AgentExecStatusType } from './state-machine';

// ==========================================
// Authentication Schemas & Types
// ==========================================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    scanCredits?: number;
  };
}

// ==========================================
// Project & Scan Schemas & Types
// ==========================================

export const CreateProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const CreateScanSchema = z.object({
  projectId: z.string().uuid('Invalid Project ID'),
});

export type CreateScanInput = z.infer<typeof CreateScanSchema>;

// ==========================================
// Multi-Agent & Orchestration Types
// ==========================================

export const VentureDNASchema = z.object({
  startupName: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  
  customerType: z.string(),
  targetAudience: z.string(),
  
  problemStatement: z.string(),
  proposedSolution: z.string(),
  
  monetizationModel: z.string(),
  acquisitionModel: z.string(),
  
  marketType: z.string(),
  geographicFocus: z.string(),
  
  operationalComplexity: z.number().min(1).max(10),
  regulationLevel: z.number().min(1).max(10),
  capitalIntensity: z.number().min(1).max(10),
  
  defensibility: z.number().min(1).max(10),
  networkEffects: z.number().min(1).max(10),
  scalability: z.number().min(1).max(10),
  
  aiDependency: z.number().min(1).max(10),
  logisticsDependency: z.number().min(1).max(10),
  complianceDependency: z.number().min(1).max(10),
  
  competitiveRisk: z.number().min(1).max(10),
  executionDifficulty: z.number().min(1).max(10),
  
  clarityScore: z.number().min(0).max(100),
});

export type VentureDNA = z.infer<typeof VentureDNASchema>;

// ==========================================
// Agent Response Types
// ==========================================

export const AgentResponseSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  agentIcon: z.string().optional(),
  status: z.enum(['FULL', 'PARTIAL', 'NONE']),
  statusLabel: z.string().optional(),
  statusColor: z.enum(['emerald', 'amber', 'rose']).optional(),
  confidence: z.number().int().min(0).max(100),
  confidenceLabel: z.string(),
  score: z.number().int().min(0).max(10).nullable(),
  scoreLabel: z.string().nullable().optional(),
  sections: z.object({
    known: z.object({
      title: z.string().default('✅ ما أعرفه'),
      items: z.array(z.string())
    }),
    unknown: z.object({
      title: z.string().default('❓ ما لا أعرفه'),
      items: z.array(z.string())
    }),
    analysis: z.object({
      title: z.string().default('💡 التحليل'),
      content: z.string()
    }),
    recommendation: z.object({
      title: z.string().default('🎯 التوصية'),
      content: z.string()
    })
  }),
  sources: z.array(z.object({
    name: z.string(),
    tier: z.enum(['A', 'B', 'C']),
    url: z.string().optional()
  })).optional().nullable()
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Aliases for backward compatibility
export const MarketAgentResponseSchema = AgentResponseSchema;
export const CompetitionAgentResponseSchema = AgentResponseSchema;
export const MonetizationAgentResponseSchema = AgentResponseSchema;
export const FeasibilityAgentResponseSchema = AgentResponseSchema;
export const RiskAgentResponseSchema = AgentResponseSchema;
export const RegulatoryAgentResponseSchema = AgentResponseSchema;
export const DebateModeratorAgentResponseSchema = AgentResponseSchema;
export const ErrorAgentResponseSchema = AgentResponseSchema;

export type AgentType = 
  | 'MarketAgent'
  | 'CompetitionAgent'
  | 'MonetizationAgent'
  | 'FeasibilityAgent'
  | 'RiskAgent'
  | 'RegulatoryAgent'
  | 'DebateModeratorAgent'
  | 'EvidenceValidatorAgent';

// Legacy DecisionSchema — kept for backward compat with orchestrator LLM prompt
export const DecisionSchema = z.enum(['BUILD', 'PIVOT', 'KILL', 'NEEDS MORE EXPLORATION', 'INTERVIEW_MODE', 'RESEARCH_REQUIRED', 'INTERVIEW_REQUIRED', 'FAILED']);
export type Decision = z.infer<typeof DecisionSchema>;

export const MarketSignalsSchema = z.object({
  demand_signal: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  trend_velocity: z.enum(['GROWING', 'STABLE', 'DECLINING']),
  competition_density: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  funding_activity: z.enum(['ACTIVE', 'LIMITED', 'NONE']),
  digital_maturity_fit: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});
export type MarketSignals = z.infer<typeof MarketSignalsSchema>;

export const SaudiContextSchema = z.object({
  vision_2030_fit: z.string().max(100),
  cultural_fit: z.string().max(250),
  payment_system_fit: z.string().max(200),
  regulatory_risk: z.string().max(250),
});
export type SaudiContext = z.infer<typeof SaudiContextSchema>;

// V3.0 OrchestratorResultSchema
export const OrchestratorResultSchema = z.object({
  meta: z.object({
    ideaTitle: z.string(),
    ideaSubtitle: z.string(),
    scanDate: z.string(),
    overallStatus: z.string(),
    progressBar: z.object({
      full: z.number(),
      partial: z.number(),
      none: z.number()
    })
  }).optional(),
  executiveSummary: z.object({
    verdict: z.string(),
    verdictColor: z.string(),
    score: z.number().int().min(0).max(100).nullable(),
    confidence: z.number().int().min(0).max(100),
    oneLiner: z.string(),
    keyInsight: z.string()
  }).optional(),
  agents: z.array(AgentResponseSchema).optional(),
  synthesis: z.object({
    title: z.string(),
    content: z.string(),
    actionItems: z.array(z.object({
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      text: z.string()
    }))
  }).optional(),
  disclaimer: z.string().optional(),

  // Legacy fields for backward compatibility and compilation safety
  idea: z.string().optional(),
  agentResults: z.any().optional(),
  summary: z.string().optional(),
  recommendation: z.string().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  verdict: z.string().nullable().optional(),
  status: z.string().optional(),
  key_reason: z.string().optional(),
  top_risks: z.array(z.string()).optional(),
  next_step: z.string().optional(),
});

export type OrchestratorResult = z.infer<typeof OrchestratorResultSchema>;

// ==========================================
// V2.0 Contracts (Fail-Closed Architecture)
// ==========================================

export const InterviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  type: z.enum(['mcq', 'free_text', 'scale', 'yes_no']),
  options: z.array(z.string()).optional(),
  context: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const AgentErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean().default(false),
});
export type AgentError = z.infer<typeof AgentErrorSchema>;

export const AgentExecResultSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  status: z.enum(['SUCCESS', 'FAILED', 'TIMEOUT', 'RATE_LIMITED']),
  dimensions: z.array(z.object({
    name: z.string(),
    score: z.number().int().min(0).max(10),
    weight: z.number().min(0).max(1),
    evidence: z.array(z.string()),
  })).optional(),
  rawResponse: z.string().optional(),
  processingTimeMs: z.number().int(),
  error: AgentErrorSchema.optional(),
});
export type AgentExecResult = z.infer<typeof AgentExecResultSchema>;

export const V2OrchestratorResultSchema = z.object({
  scanId: z.string(),
  status: z.enum(['COMPLETED', 'INTERVIEWING', 'RESEARCH_REQUIRED', 'PARTIAL', 'FAILED']),
  verdict: z.enum(['PASS', 'FAIL', 'INTERVIEWING', 'RESEARCH_REQUIRED', 'PARTIAL', 'FAILED']),
  score: z.number().int().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1).default(0),
  summary: z.string().optional(),
  questions: z.array(InterviewQuestionSchema).optional(),
  missingEvidence: z.array(z.string()).optional(),
  agentResults: z.array(AgentExecResultSchema),
  errors: z.array(z.object({
    agent: z.string(),
    code: z.string(),
    message: z.string(),
    timestamp: z.date().optional(),
  })).optional(),
});
export type V2OrchestratorResult = z.infer<typeof V2OrchestratorResultSchema>;

// ==========================================
// WebSocket Realtime Events
// ==========================================

export enum ScanWebSocketEvent {
  SCAN_STARTED = 'scan:started',
  AGENT_STARTED = 'scan:agent_started',
  AGENT_COMPLETED = 'scan:agent_completed',
  AGENT_FAILED = 'scan:agent_failed',
  SCAN_COMPLETED = 'scan:completed',
  SCAN_FAILED = 'scan:failed',
}

export interface ScanStatusPayload {
  scanId: string;
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  message?: string;
  agentType?: AgentType;
  agentScore?: number;
  result?: OrchestratorResult;
}

// ==========================================
// Evidence Validator Schema & Types
// ==========================================

export const EvidenceValidatorSchema = z.object({
  valid: z.boolean(),
  adjusted_score_factor: z.number().min(0.5).max(1.0),
  confidence_adjustment: z.number().min(0.5).max(1.0),
  critiques: z.array(z.string().max(200)).max(5),
  evidence_gaps: z.array(z.string().max(200)).max(5),
  reasoning: z.string().max(1000),
});

export type EvidenceValidatorResult = z.infer<typeof EvidenceValidatorSchema>;

// COPILOT TYPES
export interface CopilotAnalyzeResponse {
  extracted_idea: {
    type: string;
    problem: string;
    audience: string;
    domain: string;
  };
  assumptions: Array<{ element: string; guess: string }>;
  gaps: string[];
  questions: Array<{
    id: string;
    text: string;
    options: string[];
  }>;
}

export interface CopilotFinalizeResponse {
  completeness_score: number;
  profile: {
    summary: string;
    audience: string;
    problem: string;
    solution: string;
    value_proposition: string;
  };
  strengths: string[];
  unclear_points: string[];
  next_step: string;
}
