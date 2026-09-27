import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { YoutubeChannelDto } from './dto/youtube-channel.dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private youtube;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not set in environment variables');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });

    this.logger.log('✅ YouTube API initialized');
  }

  /**
   * Search for YouTube channels by query
   */
  async searchChannels(query: string, maxResults: number = 50): Promise<YoutubeChannelDto[]> {
    try {
      this.logger.log(`🔍 Searching YouTube for: "${query}"`);

      const response = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: Math.min(maxResults, 50),
        order: 'relevance',
        fields: 'items(id,snippet)',
      });

      if (!response.data.items || response.data.items.length === 0) {
        this.logger.warn(`No channels found for: "${query}"`);
        return [];
      }

      const channelIds = response.data.items
        .map((item: any) => item.id.channelId)
        .filter((id: string) => id);

      this.logger.log(`Found ${channelIds.length} channels, fetching details...`);

      const channels = await this.getChannelDetails(channelIds);
      return channels;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error);
      throw new Error(`YouTube search failed: ${error.message}`);
    }
  }

  /**
   * Get detailed info for channels (subscribers, video count, etc.)
   */
  private async getChannelDetails(channelIds: string[]): Promise<YoutubeChannelDto[]> {
    try {
      const response = await this.youtube.channels.list({
        part: 'snippet,statistics',
        id: channelIds.join(','),
        fields: 'items(id,snippet,statistics)',
      });

      const channels: YoutubeChannelDto[] = response.data.items.map((item: any) => ({
        youtubeId: item.id,
        name: item.snippet.title,
        description: item.snippet.description,
        subscribers: item.statistics.subscriberCount || '0',
        videoCount: item.statistics.videoCount || '0',
        thumbnailUrl: item.snippet.thumbnails?.high?.url,
        channelUrl: `https://www.youtube.com/channel/${item.id}`,
      }));

      return channels;
    } catch (error) {
      this.logger.error(`Failed to get channel details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get latest upload time for a channel
   */
  async getLatestUploadTime(channelId: string): Promise<Date | null> {
    try {
      const activities = await this.youtube.activities.list({
        part: 'snippet,contentDetails',
        channelId,
        maxResults: 1,
        fields: 'items(contentDetails)',
      });

      const videoId = activities.data.items?.[0]?.contentDetails?.upload?.videoId;

      if (!videoId) {
        this.logger.warn(`No recent uploads found for channel: ${channelId}`);
        return null;
      }

      const video = await this.youtube.videos.list({
        part: 'snippet',
        id: videoId,
        fields: 'items(snippet(publishedAt))',
      });

      const publishedAt = video.data.items?.[0]?.snippet?.publishedAt;
      return publishedAt ? new Date(publishedAt) : null;
    } catch (error) {
      this.logger.warn(`Failed to get latest upload for ${channelId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Enrich channel data with latest upload
   * EMAIL SCRAPING DISABLED - Will be implemented later
   */
  async enrichChannelData(channel: YoutubeChannelDto): Promise<YoutubeChannelDto> {
    try {
      this.logger.log(`⏳ Enriching channel: ${channel.name}`);

      // Get latest upload time
      const latestUpload = await this.getLatestUploadTime(channel.youtubeId);

      // Return enriched channel WITHOUT email
      return {
        ...channel,
        latestUpload,
        email: undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to enrich channel ${channel.youtubeId}: ${error.message}`);
      return channel;
    }
  }

  /**
   * Search and enrich multiple channels (sequential)
   */
  async searchAndEnrich(query: string, maxResults: number = 50): Promise<YoutubeChannelDto[]> {
    try {
      // Step 1: Search for channels
      const channels = await this.searchChannels(query, maxResults);

      if (channels.length === 0) {
        return [];
      }

      this.logger.log(`📊 Enriching ${channels.length} channels with latest uploads...`);

      // Step 2: Enrich each channel sequentially
      const enrichedChannels: YoutubeChannelDto[] = [];
      for (const channel of channels) {
        try {
          const enriched = await this.enrichChannelData(channel);
          enrichedChannels.push(enriched);
          // Small delay between requests
          await this.delay(500);
        } catch (error) {
          this.logger.error(`Failed to enrich channel ${channel.youtubeId}: ${error.message}`);
          enrichedChannels.push(channel);
        }
      }

      this.logger.log(`✅ Enriched all channels successfully`);
      return enrichedChannels;
    } catch (error) {
      this.logger.error(`Search and enrich failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}