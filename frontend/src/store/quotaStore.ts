import { create } from 'zustand';

export interface Quota {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetTime: string;
  timeUntilReset: string;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
}

interface QuotaStore {
  quota: Quota | null;
  setQuota: (quota: Quota) => void;
  fetchQuota: () => Promise<void>;
}

export const useQuotaStore = create<QuotaStore>((set) => ({
  quota: null,

  setQuota: (quota) => set({ quota }),

  fetchQuota: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/api/channels/quota', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        set({ quota: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  },
}));