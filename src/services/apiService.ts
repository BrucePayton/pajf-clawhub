import { io } from 'socket.io-client';

const API_URL = window.location.origin;
const socket = io(API_URL);
const MAX_CASE_PAYLOAD_BYTES = 18 * 1024 * 1024;

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  token?: string;
  photoURL?: string;
}

export interface LikeCaseResult {
  success: boolean;
  duplicated?: boolean;
  likeCount?: number;
  message?: string;
}

export interface LoginResult {
  success: boolean;
  user?: User | null;
  message?: string;
}

export interface CaseComment {
  id: string;
  case_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

const getStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('internal_user');
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch (_error) {
    localStorage.removeItem('internal_user');
    return null;
  }
};

const getAuthHeaders = (user?: User | null): Record<string, string> => {
  const currentUser = user || getStoredUser();
  if (!currentUser?.token) return {};
  return { Authorization: `Bearer ${currentUser.token}` };
};

export const apiService = {
  // Auth
  login: async (username: string, password: string): Promise<LoginResult> => {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, user: { ...data.user, token: data.token } };
    }
    return { success: false, user: null, message: data?.message || '登录失败' };
  },

  // User Management
  registerUser: async (username: string, password: string, email?: string, role?: string): Promise<{ success: boolean; user?: any; message?: string }> => {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ username, password, email, role })
    });
    return await response.json();
  },

  getUsers: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      return await response.json();
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || '获取用户列表失败');
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await response.json();
  },

  // Cases
  // owner_id: if provided, shows public + user's private cases; if undefined, shows only public cases
  getCases: async (owner_id?: string, case_type?: string): Promise<any[]> => {
    let url = `${API_URL}/api/cases`;
    const params = new URLSearchParams();
    if (case_type) params.set('case_type', case_type);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
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
    const response = await fetch(`${API_URL}/api/cases/${id}/like`, {
      method: 'POST',
      headers: getAuthHeaders(user),
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...getAuthHeaders(user) };

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
    const response = await fetch(`${API_URL}/api/cases/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(user),
    });
    if (response.status === 401) {
      throw new Error('CASE_UNAUTHORIZED');
    }
    if (response.status === 403) {
      throw new Error('CASE_DELETE_FORBIDDEN');
    }
    return response.ok;
  },

  // Real-time — server emits { event: 'refresh' }; callback re-fetches via GET /api/cases
  onCasesUpdated: (callback: () => void) => {
    socket.on('cases_updated', callback);
    return () => socket.off('cases_updated', callback);
  },

  // DB Config
  getDbConfig: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/api/db-config`, {
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  saveDbConfig: async (config: any): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/api/db-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(config)
    });
    return await response.json();
  },

  resetDbConfig: async (): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/db-config/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.ok;
  },

  testDbConnection: async (config: any): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_URL}/api/db-config/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(config)
    });
    const data = await response.json();
    return { success: !!data.success, message: typeof data.message === 'string' ? data.message : undefined };
  },

  getComments: async (caseId: string): Promise<CaseComment[]> => {
    try {
      const response = await fetch(`${API_URL}/api/cases/${caseId}/comments`);
      if (!response.ok) return [];
      return await response.json();
    } catch { return []; }
  },

  postComment: async (caseId: string, content: string): Promise<{ success: boolean; comment?: CaseComment; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/cases/${caseId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ content }),
      });
      return await response.json();
    } catch { return { success: false, message: '网络异常' }; }
  },

  deleteComment: async (commentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return response.ok;
    } catch { return false; }
  },
};
