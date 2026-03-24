import { io } from 'socket.io-client';

const API_URL = window.location.origin;
const socket = io(API_URL);
const MAX_CASE_PAYLOAD_BYTES = 18 * 1024 * 1024;

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
}

export interface LikeCaseResult {
  success: boolean;
  duplicated?: boolean;
  likeCount?: number;
  message?: string;
}

export const apiService = {
  // Auth
  login: async (username: string, password: string): Promise<User | null> => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  },

  // User Management
  registerUser: async (username: string, password: string, email?: string, role?: string): Promise<{ success: boolean; user?: any; message?: string }> => {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, role })
    });
    return await response.json();
  },

  getUsers: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/users`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  },

  // Cases
  // owner_id: if provided, shows public + user's private cases; if undefined, shows only public cases
  getCases: async (owner_id?: string, case_type?: string): Promise<any[]> => {
    let url = `${API_URL}/api/cases`;
    const params = new URLSearchParams();
    if (owner_id) params.set('owner_id', owner_id);
    if (case_type) params.set('case_type', case_type);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  bootstrapCases: async (): Promise<{ success: boolean; inserted?: number }> => {
    const response = await fetch(`${API_URL}/api/cases/bootstrap`, {
      method: 'POST',
    });
    if (!response.ok) {
      return { success: false };
    }
    return await response.json();
  },

  likeCase: async (id: string, user?: User | null): Promise<LikeCaseResult> => {
    const savedUser = localStorage.getItem('internal_user');
    const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);
    const headers: Record<string, string> = {};
    if (currentUser) {
      headers['X-User-ID'] = currentUser.uid;
    }
    const response = await fetch(`${API_URL}/api/cases/${id}/like`, {
      method: 'POST',
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data?.message || '点赞失败' };
    }
    return {
      success: true,
      duplicated: !!data?.duplicated,
      likeCount: data?.likeCount,
      message: data?.message,
    };
  },

  saveCase: async (caseData: any, user?: User | null): Promise<boolean> => {
    const savedUser = localStorage.getItem('internal_user');
    const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentUser) {
      headers['X-User-ID'] = currentUser.uid;
      headers['X-User-Role'] = currentUser.role || 'user';
    }

    const payload = JSON.stringify(caseData);
    const payloadSizeBytes = new TextEncoder().encode(payload).length;
    if (payloadSizeBytes > MAX_CASE_PAYLOAD_BYTES) {
      throw new Error('CASE_PAYLOAD_TOO_LARGE');
    }

    const response = await fetch(`${API_URL}/api/cases`, {
      method: 'POST',
      headers,
      body: payload
    });
    if (response.status === 403) {
      throw new Error('CASE_FORBIDDEN');
    }
    if (response.status === 401) {
      throw new Error('CASE_UNAUTHORIZED');
    }
    return response.ok;
  },

  deleteCase: async (id: string, user?: User | null): Promise<boolean> => {
    const savedUser = localStorage.getItem('internal_user');
    const currentUser = user || (savedUser ? JSON.parse(savedUser) : null);

    const headers: Record<string, string> = {};
    if (currentUser) {
      headers['X-User-ID'] = currentUser.uid;
    }

    const response = await fetch(`${API_URL}/api/cases/${id}`, {
      method: 'DELETE',
      headers
    });
    if (response.status === 401) {
      throw new Error('CASE_UNAUTHORIZED');
    }
    if (response.status === 403) {
      throw new Error('CASE_DELETE_FORBIDDEN');
    }
    return response.ok;
  },

  // Real-time
  onCasesUpdated: (callback: (cases: any[]) => void) => {
    socket.on('cases_updated', callback);
    return () => socket.off('cases_updated', callback);
  },

  // DB Config
  getDbConfig: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/api/db-config`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  saveDbConfig: async (config: any): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/api/db-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await response.json();
  },

  resetDbConfig: async (): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/db-config/reset`, {
      method: 'POST'
    });
    return response.ok;
  },

  testDbConnection: async (config: any): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/db-config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return data.success;
  }
};
