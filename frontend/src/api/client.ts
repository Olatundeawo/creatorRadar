import axios from 'axios';
import type { Channel, SearchResponse, GetChannelsResponse, CountResponse } from '../types/channel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const channelAPI = {
  // Channels
  search: (query: string, niche?: string, maxResults?: number) =>
    client.post<SearchResponse>('/channels/search', {
      query,
      niche,
      maxResults,
    }),

  getChannels: (page = 1, limit = 20, sort = 'scrapedAt', order = 'desc') =>
    client.get<GetChannelsResponse>('/channels', {
      params: { page, limit, sort, order },
    }),

  getCount: () => client.get<CountResponse>('/channels/count'),

  getChannel: (youtubeId: string) => client.get<Channel>(`/channels/${youtubeId}`),

  deleteChannel: (id: string) => client.delete<Channel>(`/channels/${id}`),

  // Quota
  getQuota: () => client.get('/channels/quota'),

  // Export
  exportCSV: () =>
    client.get('/export/channels?format=csv', { responseType: 'blob' }),

  exportXLSX: () =>
    client.get('/export/channels?format=xlsx', { responseType: 'blob' }),
};

export default client;