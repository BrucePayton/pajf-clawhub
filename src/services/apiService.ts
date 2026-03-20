import { io } from 'socket.io-client';

const API_URL = window.location.origin;
const socket = io(API_URL);

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
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

  // Cases
  getCases: async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/cases`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  },

  saveCase: async (caseData: any): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    return response.ok;
  },

  deleteCase: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/cases/${id}`, {
      method: 'DELETE'
    });
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
