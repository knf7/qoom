import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  scanCredits?: number;
}

interface StoreState {
  user: User | null;
  token: string | null;
  projects: any[];

  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  
  // Actions
  setAuth: (user: User | null, token: string | null) => void;
  setUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setProjects: (projects: any[]) => void;

  logout: () => void;
}

const checkTokenExpiry = (token: string | null) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

const initialToken = localStorage.getItem('qoom_token');
const isTokenValid = checkTokenExpiry(initialToken);
if (!isTokenValid && initialToken) {
  localStorage.removeItem('qoom_token');
  localStorage.removeItem('qoom_user');
}

export const useStore = create<StoreState>((set) => ({
  user: isTokenValid ? JSON.parse(localStorage.getItem('qoom_user') || 'null') : null,
  token: isTokenValid ? initialToken : null,
  projects: [],

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

  setUser: (partial) =>
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...partial };
      localStorage.setItem('qoom_user', JSON.stringify(updated));
      return { user: updated };
    }),

  refreshUser: async () => {
    const { token } = useStore.getState();
    if (!token) return;
    try {
      // Dynamically import apiClient to avoid circular dep at module init
      const { apiClient } = await import('../utils/apiClient');
      const data = await apiClient('/auth/me');
      if (data && data.id) {
        const updated = { ...useStore.getState().user, ...data };
        localStorage.setItem('qoom_user', JSON.stringify(updated));
        useStore.setState({ user: updated });
      }
    } catch {
      // silent fail — don't break the app
    }
  },

  setProjects: (projects) => set({ projects }),



  logout: () => {
    localStorage.removeItem('qoom_token');
    localStorage.removeItem('qoom_user');
    set({ user: null, token: null, projects: [] });
  },
}));
