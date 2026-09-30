import { create } from 'zustand';
import type { Channel } from '../types/channel';

export interface FilterState {
  minSubscribers: number;
  maxSubscribers: number;
  minVideos: number;
  maxVideos: number;
  searchText: string;
}

interface AppStore {
  // State
  channels: Channel[];
  filteredChannels: Channel[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  filters: FilterState;

  // Actions
  setChannels: (channels: Channel[]) => void;
  setFilteredChannels: (channels: Channel[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotalCount: (count: number) => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  clearError: () => void;
  resetState: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  channels: [],
  filteredChannels: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  filters: {
    minSubscribers: 0,
    maxSubscribers: 10000000,
    minVideos: 0,
    maxVideos: 100000,
    searchText: '',
  },

  // Actions
  setChannels: (channels) => set({ channels }),
  setFilteredChannels: (filteredChannels) => set({ filteredChannels }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  applyFilters: () => {
    const { channels, filters } = get();

    const filtered = channels.filter((ch) => {
      const subscribers = parseInt(ch.subscribers) || 0;
      const videos = parseInt(ch.videoCount) || 0;
      const nameMatch = ch.name.toLowerCase().includes(filters.searchText.toLowerCase());

      return (
        subscribers >= filters.minSubscribers &&
        subscribers <= filters.maxSubscribers &&
        videos >= filters.minVideos &&
        videos <= filters.maxVideos &&
        nameMatch
      );
    });

    set({ filteredChannels: filtered });
  },

  resetFilters: () => {
    set({
      filters: {
        minSubscribers: 0,
        maxSubscribers: 10000000,
        minVideos: 0,
        maxVideos: 100000,
        searchText: '',
      },
    });
    get().applyFilters();
  },

  clearError: () => set({ error: null }),
  resetState: () =>
    set({
      channels: [],
      filteredChannels: [],
      loading: false,
      error: null,
      totalCount: 0,
      currentPage: 1,
      searchQuery: '',
      filters: {
        minSubscribers: 0,
        maxSubscribers: 10000000,
        minVideos: 0,
        maxVideos: 100000,
        searchText: '',
      },
    }),
}));