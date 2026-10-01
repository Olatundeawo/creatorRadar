import { create } from 'zustand';
import client from '../api/client';

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
      const response = await client.get('/channels/quota');

      set({ quota: response.data.data });
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  },
}));