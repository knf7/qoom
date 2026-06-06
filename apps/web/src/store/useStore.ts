import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
}

interface StoreState {
  user: User | null;
  token: string | null;
  projects: any[];
  activeScanId: string | null;
  scanProgress: {
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    message: string;
    completedAgents: string[];
    agentScores: Record<string, number>;
    result?: any;
  } | null;
  
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  
  // Actions
  setAuth: (user: User | null, token: string | null) => void;
  setProjects: (projects: any[]) => void;
  setActiveScanId: (scanId: string | null) => void;
  updateScanProgress: (update: Partial<StoreState['scanProgress']>) => void;
  resetScanProgress: () => void;
  logout: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: JSON.parse(localStorage.getItem('qoom_user') || 'null'),
  token: localStorage.getItem('qoom_token'),
  projects: [],
  activeScanId: null,
  scanProgress: null,
  lang: (localStorage.getItem('qoom_lang') as any) || 'ar',

  setLang: (lang) => {
    localStorage.setItem('qoom_lang', lang);
    set({ lang });
  },

  setAuth: (user, token) => {
    if (token && user) {
      localStorage.setItem('qoom_token', token);
      localStorage.setItem('qoom_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qoom_token');
      localStorage.removeItem('qoom_user');
    }
    set({ user, token });
  },

  setProjects: (projects) => set({ projects }),

  setActiveScanId: (scanId) => set({ activeScanId: scanId }),

  updateScanProgress: (update) =>
    set((state) => ({
      scanProgress: state.scanProgress
        ? { ...state.scanProgress, ...update }
        : {
            status: 'PENDING',
            message: 'Initializing...',
            completedAgents: [],
            agentScores: {},
            ...update,
          },
    })),

  resetScanProgress: () => set({ scanProgress: null }),

  logout: () => {
    localStorage.removeItem('qoom_token');
    localStorage.removeItem('qoom_user');
    set({ user: null, token: null, projects: [], activeScanId: null, scanProgress: null });
  },
}));
