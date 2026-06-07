import { useStore } from '../store/useStore';

const getApiUrl = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_API_URL) {
    return metaEnv.VITE_API_URL;
  }
  // If running in production (not localhost/127.0.0.1), use the live Render API url
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://qoom.onrender.com';
  }
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiClient(endpoint: string, options: FetchOptions = {}) {
  const { token, logout } = useStore.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Auto logout on 401
    if (response.status === 401) {
      logout();
      window.location.href = '/auth';
      throw new Error('Unauthorized');
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new Error(data.message || (typeof data === 'string' ? data : 'API Error'));
    }

    return data;
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('لا يمكن الوصول إلى الخادم. يرجى التأكد من تشغيل الـ API.');
    }
    throw error;
  }
}
