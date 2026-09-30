import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private youtube: any;
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 3600000; // 1 hour

  // Quota tracking
  private quotaUsed = 0;
  private quotaLimit = 10000;
  private quotaResetTime = this.getNextMidnightPT();

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    // Reset quota every 24 hours
    this.startQuotaResetTimer();
  }

  /**
   * Get quota info
   */
  getQuotaInfo() {
    const now = Date.now();
    const resetTime = this.quotaResetTime;
    const timeUntilReset = Math.max(0, resetTime - now);
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    return {
      used: this.quotaUsed,
      limit: this.quotaLimit,
      remaining: this.quotaLimit - this.quotaUsed,
      percentage: Math.round((this.quotaUsed / this.quotaLimit) * 100),
      resetTime: new Date(this.quotaResetTime).toISOString(),
      timeUntilReset: `${hoursUntilReset}h ${minutesUntilReset}m`,
      status: this.getQuotaStatus(),
    };
  }

  /**
   * Get quota status
   */
  private getQuotaStatus(): 'ok' | 'warning' | 'critical' | 'exceeded' {
    const percentage = (this.quotaUsed / this.quotaLimit) * 100;

    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'critical';
    if (percentage >= 50) return 'warning';
    return 'ok';
  }

  /**
   * Calculate next midnight PT
   */
  private getNextMidnightPT(): number {
    const now = new Date();
    const ptTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const nextMidnight = new Date(ptTime);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    return nextMidnight.getTime();
  }

  /**
   * Start quota reset timer
   */
  private startQuotaResetTimer() {
    setInterval(() => {
      const now = Date.now();
      if (now >= this.quotaResetTime) {
        this.quotaUsed = 0;
        this.quotaResetTime = this.getNextMidnightPT();
        this.logger.log('✅ Daily quota reset!');
      }
    }, 60000); // Check every minute
  }

  /**
   * Track quota usage
   */
  private addQuotaUsage(credits: number) {
    this.quotaUsed += credits;
    this.logger.warn(
      `📊 Quota: ${this.quotaUsed}/${this.quotaLimit} (${Math.round(
        (this.quotaUsed / this.quotaLimit) * 100,
      )}%)`,
    );
  }

  /**
   * Check if quota available
   */
  private checkQuota(estimatedCost: number): void {
    if (this.quotaUsed + estimatedCost > this.quotaLimit) {
      const quota = this.getQuotaInfo();
      throw new BadRequestException(
        `YouTube API quota exceeded. Resets in ${quota.timeUntilReset}. Try again later.`,
      );
    }
  }

  /**
   * Search with caching and quota tracking
   */
  async searchAndEnrich(
    query: string,
    niche?: string,
    maxResults: number = 10,
  ) {
    const cacheKey = `${query}-${niche}-${maxResults}`;

    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      this.logger.log(`📦 Cache hit: ${query}`);
      return cached.data;
    }

    // Estimate cost: 100 for search + 1 per channel + 1 per latest upload
    const estimatedCost = 100 + maxResults * 2;
    this.checkQuota(estimatedCost);

    this.logger.log(
      `🔍 Searching: ${query} (niche: ${niche || 'general'}, estimated cost: ${estimatedCost})`,
    );

    try {
      // Search videos
      const { data: searchResults } = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: Math.min(maxResults, 50),
      });

      this.addQuotaUsage(100);

      // Extract unique channel IDs
      const channelIds = new Set<string>();
      searchResults.items.forEach((item: any) => {
        if (item.snippet?.channelId) {
          channelIds.add(item.snippet.channelId);
        }
      });

      // Batch get channel details
      const channels = await this.getChannelDetailsInBatches(
        Array.from(channelIds),
      );

      // Cache results
      this.searchCache.set(cacheKey, { data: channels, timestamp: Date.now() });

      this.logger.log(`✅ Found ${channels.length} unique channels`);
      return channels;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

    /**
   * Get channel details in batches
   */
  private async getChannelDetailsInBatches(channelIds: string[]): Promise<any[]> {
    if (channelIds.length === 0) return [];

    const allChannels: any[] = []; // Explicitly type as any[]

    // Process in batches of 50
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);

      try {
        const { data } = await this.youtube.channels.list({
          part: ['snippet', 'statistics'],
          id: batch,
        });

        this.addQuotaUsage(1); // 1 credit per batch

        const enrichedChannels = await Promise.all(
          data.items.map((channel: any) => this.enrichChannelData(channel)),
        );

        allChannels.push(...enrichedChannels);
      } catch (error) {
        this.logger.warn(`Failed to get channel details: ${error.message}`);
      }
    }

    return allChannels;
  }

  /**
   * Enrich with latest upload
   */
  private async enrichChannelData(channel: any) {
    try {
      const { data: activities } = await this.youtube.activities.list({
        part: ['snippet'],
        channelId: channel.id,
        maxResults: 1,
      });

      this.addQuotaUsage(1); // 1 credit per channel

      return {
        youtubeId: channel.id,
        name: channel.snippet?.title,
        description: channel.snippet?.description,
        subscribers: channel.statistics?.subscriberCount || '0',
        videoCount: channel.statistics?.videoCount || '0',
        thumbnailUrl: channel.snippet?.thumbnails?.medium?.url,
        channelUrl: `https://youtube.com/channel/${channel.id}`,
        latestUpload: activities.items?.[0]?.snippet?.publishedAt,
        email: null,
      };
    } catch (error) {
      this.logger.warn(`Failed to enrich channel ${channel.id}`);
      return {
        youtubeId: channel.id,
        name: channel.snippet?.title,
        description: channel.snippet?.description,
        subscribers: channel.statistics?.subscriberCount || '0',
        videoCount: channel.statistics?.videoCount || '0',
        thumbnailUrl: channel.snippet?.thumbnails?.medium?.url,
        channelUrl: `https://youtube.com/channel/${channel.id}`,
        latestUpload: null,
        email: null,
      };
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.searchCache.delete(key);
      }
    }
  }
}