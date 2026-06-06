// ══════════════════════════════════════════════════════════════════════════════
// QOOM V2.0 — Unified State Machine
// Single Source of Truth for ALL status values across ALL layers.
// ══════════════════════════════════════════════════════════════════════════════

// ─── Project Status ───────────────────────────────────────────────────────────
export const ProjectStatus = {
  DRAFT: 'DRAFT',
  INTERVIEWING: 'INTERVIEWING',
  READY_FOR_ANALYSIS: 'READY_FOR_ANALYSIS',
  ANALYZING: 'ANALYZING',
  ANALYZED: 'ANALYZED',
  FAILED: 'FAILED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

// ─── Scan Status ──────────────────────────────────────────────────────────────
export const ScanStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  INTERVIEWING: 'INTERVIEWING',
  RESEARCH_REQUIRED: 'RESEARCH_REQUIRED',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const;

export type ScanStatus = typeof ScanStatus[keyof typeof ScanStatus];

// ─── Scan Verdict ─────────────────────────────────────────────────────────────
export const ScanVerdict = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  INTERVIEWING: 'INTERVIEWING',
  RESEARCH_REQUIRED: 'RESEARCH_REQUIRED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const;

export type ScanVerdict = typeof ScanVerdict[keyof typeof ScanVerdict];

// ─── Agent Execution Status ───────────────────────────────────────────────────
export const AgentExecStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type AgentExecStatus = typeof AgentExecStatus[keyof typeof AgentExecStatus];

// ─── IRA Classification Status ────────────────────────────────────────────────
export const IRAStatus = {
  INTERVIEW_REQUIRED: 'INTERVIEW_REQUIRED',
  RESEARCH_REQUIRED: 'RESEARCH_REQUIRED',
  FULL_ANALYSIS: 'FULL_ANALYSIS',
  FAIL: 'FAIL',
} as const;

export type IRAStatus = typeof IRAStatus[keyof typeof IRAStatus];

// ─── State Transition Validation ──────────────────────────────────────────────

const VALID_PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.ANALYZING, ProjectStatus.INTERVIEWING],
  [ProjectStatus.INTERVIEWING]: [ProjectStatus.READY_FOR_ANALYSIS, ProjectStatus.DRAFT, ProjectStatus.FAILED],
  [ProjectStatus.READY_FOR_ANALYSIS]: [ProjectStatus.ANALYZING],
  [ProjectStatus.ANALYZING]: [ProjectStatus.ANALYZED, ProjectStatus.INTERVIEWING, ProjectStatus.FAILED],
  [ProjectStatus.ANALYZED]: [ProjectStatus.DRAFT], // re-scan
  [ProjectStatus.FAILED]: [ProjectStatus.DRAFT],   // retry
};

const VALID_SCAN_TRANSITIONS: Record<ScanStatus, ScanStatus[]> = {
  [ScanStatus.PENDING]: [ScanStatus.RUNNING, ScanStatus.FAILED],
  [ScanStatus.RUNNING]: [ScanStatus.COMPLETED, ScanStatus.PARTIAL, ScanStatus.INTERVIEWING, ScanStatus.RESEARCH_REQUIRED, ScanStatus.FAILED],
  [ScanStatus.INTERVIEWING]: [ScanStatus.RUNNING, ScanStatus.FAILED],       // after user answers
  [ScanStatus.RESEARCH_REQUIRED]: [ScanStatus.RUNNING, ScanStatus.FAILED],  // after evidence added
  [ScanStatus.COMPLETED]: [],   // terminal
  [ScanStatus.PARTIAL]: [],     // terminal
  [ScanStatus.FAILED]: [],      // terminal
};

export function isValidProjectTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return VALID_PROJECT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidScanTransition(from: ScanStatus, to: ScanStatus): boolean {
  return VALID_SCAN_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Scan Status → Project Status Mapping ─────────────────────────────────────

export function mapScanStatusToProjectStatus(scanStatus: ScanStatus): ProjectStatus {
  const mapping: Record<ScanStatus, ProjectStatus> = {
    [ScanStatus.PENDING]: ProjectStatus.ANALYZING,
    [ScanStatus.RUNNING]: ProjectStatus.ANALYZING,
    [ScanStatus.INTERVIEWING]: ProjectStatus.INTERVIEWING,
    [ScanStatus.RESEARCH_REQUIRED]: ProjectStatus.ANALYZING,
    [ScanStatus.COMPLETED]: ProjectStatus.ANALYZED,
    [ScanStatus.PARTIAL]: ProjectStatus.ANALYZED,
    [ScanStatus.FAILED]: ProjectStatus.FAILED,
  };
  return mapping[scanStatus] ?? ProjectStatus.FAILED;
}
