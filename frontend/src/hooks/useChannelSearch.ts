import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useQuotaStore } from '../store/quotaStore';
import { useToastStore } from '../store/toastStore';
import { channelAPI } from '../api/client';

export const useChannelSearch = () => {
  const {
    setChannels,
    setFilteredChannels,
    setLoading,
    setError,
    setTotalCount,
    setCurrentPage,
    applyFilters,
  } = useAppStore();

  const { fetchQuota } = useQuotaStore();
  const { addToast } = useToastStore();

  const search = useCallback(
    async (query: string, niche?: string, maxResults?: number) => {
      setLoading(true);
      setError('');

      try {
        const response = await channelAPI.search(query, niche, maxResults);

        setChannels(response.data.data || []);
        setCurrentPage(1);

        // Fetch quota after search
        await fetchQuota();

        setTimeout(() => applyFilters(), 0);
        addToast(`Found ${response.data.count} channels`, 'success');
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Search failed';
        setError(message);
        setChannels([]);
        addToast(message, 'error');
        
        // Fetch quota to show updated warning
        await fetchQuota();
      } finally {
        setLoading(false);
      }
    },
    [setChannels, setLoading, setError, setCurrentPage, applyFilters, addToast, fetchQuota],
  );

  const getChannels = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');

      try {
        const response = await channelAPI.getChannels(page);

        setChannels(response.data.data || []);
        setTotalCount(response.data.pagination?.total || 0);
        setCurrentPage(page);

        setTimeout(() => applyFilters(), 0);
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to load channels';
        setError(message);
        addToast(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [setChannels, setLoading, setError, setTotalCount, setCurrentPage, applyFilters, addToast],
  );

  const deleteChannel = useCallback(
    async (id: string) => {
      try {
        await channelAPI.deleteChannel(id);
        await getChannels(1);
        addToast('Channel deleted successfully', 'success');
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to delete channel';
        setError(message);
        addToast(message, 'error');
      }
    },
    [getChannels, setError, addToast],
  );

  return { search, getChannels, deleteChannel };
};