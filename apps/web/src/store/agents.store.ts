import { create } from 'zustand';

export type AgentStatus = 'IDLE' | 'THINKING' | 'STREAMING' | 'DEBATING' | 'COMPLETED' | 'FAILED';

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  color: string;
  currentThought?: string;
}

interface AgentsStore {
  agents: Record<string, AgentState>;
  terminalLogs: { id: string; timestamp: number; message: string; agentId?: string }[];
  isScanning: boolean;
  scanProgress: number;
  
  initializeSwarm: () => void;
  updateAgentStatus: (agentId: string, status: AgentStatus, thought?: string) => void;
  addTerminalLog: (message: string, agentId?: string) => void;
  setScanning: (isScanning: boolean) => void;
  setScanProgress: (progress: number) => void;
  reset: () => void;
}

const INITIAL_AGENTS: Record<string, AgentState> = {
  orchestrator: { id: 'orchestrator', name: 'Queen', role: 'Swarm Orchestrator', status: 'IDLE', color: '#10B981' },
  market: { id: 'market', name: 'MarketAgent', role: 'Market Strategist', status: 'IDLE', color: '#10B981' },
  competition: { id: 'competition', name: 'CompetitionAgent', role: 'Competitive Intelligence', status: 'IDLE', color: '#f97316' },
  finance: { id: 'finance', name: 'MonetizationAgent', role: 'Financial Analyst', status: 'IDLE', color: '#f59e0b' },
  feasibility: { id: 'feasibility', name: 'FeasibilityAgent', role: 'Tech Architect', status: 'IDLE', color: '#06b6d4' },
  risk: { id: 'risk', name: 'RiskAgent', role: 'Risk Analyst', status: 'IDLE', color: '#f43f5e' },
  regulatory: { id: 'regulatory', name: 'RegulatoryAgent', role: 'Compliance Officer', status: 'IDLE', color: '#3b82f6' },
  validator: { id: 'validator', name: 'EvidenceValidator', role: 'Skeptical Auditor', status: 'IDLE', color: '#8b5cf6' },
};

export const useAgentsStore = create<AgentsStore>((set) => ({
  agents: INITIAL_AGENTS,
  terminalLogs: [],
  isScanning: false,
  scanProgress: 0,

  initializeSwarm: () => set({ agents: { ...INITIAL_AGENTS }, terminalLogs: [], isScanning: true, scanProgress: 0 }),
  
  updateAgentStatus: (agentId, status, thought) => set((state) => {
    if (!state.agents[agentId]) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { ...state.agents[agentId], status, currentThought: thought || state.agents[agentId].currentThought }
      }
    };
  }),

  addTerminalLog: (message, agentId) => set((state) => ({
    terminalLogs: [...state.terminalLogs, { id: crypto.randomUUID(), timestamp: Date.now(), message, agentId }]
  })),

  setScanning: (isScanning) => set({ isScanning }),
  
  setScanProgress: (scanProgress) => set({ scanProgress }),

  reset: () => set({ agents: INITIAL_AGENTS, terminalLogs: [], isScanning: false, scanProgress: 0 })
}));
