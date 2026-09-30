import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

export interface Analytics {
  totalChannels: number;
  totalSubscribers: number;
  averageSubscribers: number;
  minSubscribers: number;
  maxSubscribers: number;
  totalVideos: number;
  averageVideos: number;
  minVideos: number;
  maxVideos: number;
  recentChannels: any[];
  subscribersInRange: (range: string) => number;
  videosInRange: (range: string) => number;
}

export const useAnalytics = (): Analytics | null => {
  const { channels } = useAppStore();

  return useMemo(() => {
    // Return null if no channels
    if (!channels || channels.length === 0) {
      return null;
    }

    // Helper to parse numbers from strings like "1.2M", "500K", etc
    const parseNumber = (str: string): number => {
      if (!str) return 0;
      
      const num = parseFloat(str);
      if (str.includes('M')) return num * 1000000;
      if (str.includes('K')) return num * 1000;
      return num;
    };

    // Convert string subscribers/videos to numbers
    const subscribersArray = channels.map((ch) => parseNumber(ch.subscribers));
    const videosArray = channels.map((ch) => parseNumber(ch.videoCount));

    const totalSubscribers = subscribersArray.reduce((a, b) => a + b, 0);
    const totalVideos = videosArray.reduce((a, b) => a + b, 0);

    // Calculations
    const analytics: Analytics = {
      totalChannels: channels.length,
      totalSubscribers,
      averageSubscribers: Math.round(totalSubscribers / channels.length),
      minSubscribers: Math.min(...subscribersArray),
      maxSubscribers: Math.max(...subscribersArray),
      totalVideos,
      averageVideos: Math.round(totalVideos / channels.length),
      minVideos: Math.min(...videosArray),
      maxVideos: Math.max(...videosArray),
      recentChannels: channels.slice(0, 5),

      // Distribution helpers
      subscribersInRange: (range: string): number => {
        if (range === '0-100k') {
          return channels.filter((ch) => parseNumber(ch.subscribers) <= 100000).length;
        }
        if (range === '100k-1m') {
          return channels.filter(
            (ch) =>
              parseNumber(ch.subscribers) > 100000 && parseNumber(ch.subscribers) <= 1000000,
          ).length;
        }
        if (range === '1m+') {
          return channels.filter((ch) => parseNumber(ch.subscribers) > 1000000).length;
        }
        return 0;
      },

      videosInRange: (range: string): number => {
        if (range === '0-100') {
          return channels.filter((ch) => parseNumber(ch.videoCount) <= 100).length;
        }
        if (range === '100-1k') {
          return channels.filter(
            (ch) => parseNumber(ch.videoCount) > 100 && parseNumber(ch.videoCount) <= 1000,
          ).length;
        }
        if (range === '1k+') {
          return channels.filter((ch) => parseNumber(ch.videoCount) > 1000).length;
        }
        return 0;
      },
    };

    return analytics;
  }, [channels]);
};