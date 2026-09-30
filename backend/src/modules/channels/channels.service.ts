import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScraperService } from '../scraper/scraper.service';
import type { YoutubeChannelDto } from '../scraper/dto/youtube-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaService,
    private scraperService: ScraperService,
  ) {}

  /**
   * Search YouTube channels
   */
  async search(
    query: string,
    niche?: string,
    maxResults: number = 10,
  ): Promise<YoutubeChannelDto[]> {
    try {
      this.logger.log(
        `🔍 Searching YouTube: ${query} (niche: ${niche || 'general'})`,
      );

      const channels = await this.scraperService.searchAndEnrich(
        query,
        niche,
        maxResults,
      );

      this.logger.log(` Found ${channels.length} channels`);
      return channels;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save channels and link to user
   */
  async saveChannelsForUser(
    userId: string,
    channels: YoutubeChannelDto[],
    query: string,
    niche?: string,
    resultCount?: number,
  ) {
    try {
      // Save search record
      await this.prisma.savedSearch.create({
        data: {
          userId,
          query,
          niche: niche || 'general',
          resultCount: resultCount || channels.length,
        },
      });

      // Upsert channels and link to user
      for (const channel of channels) {
        try {
          // Save/update channel in global table
          const savedChannel = await this.prisma.channel.upsert({
            where: { youtubeId: channel.youtubeId },
            update: {
              subscribers: channel.subscribers,
              videoCount: channel.videoCount,
              latestUpload: channel.latestUpload,
              updatedAt: new Date(),
            },
            create: {
              youtubeId: channel.youtubeId,
              name: channel.name,
              description: channel.description,
              subscribers: channel.subscribers,
              videoCount: channel.videoCount,
              email: channel.email || null,
              latestUpload: channel.latestUpload,
              thumbnailUrl: channel.thumbnailUrl,
              channelUrl: channel.channelUrl,
            },
          });

          // Link channel to user (avoid duplicates)
          await this.prisma.userChannel.upsert({
            where: {
              userId_channelId: {
                userId,
                channelId: savedChannel.id,
              },
            },
            update: {},
            create: {
              userId,
              channelId: savedChannel.id,
              isFavorite: false,
            },
          });
        } catch (error) {
          this.logger.warn(
            `Failed to save channel ${channel.youtubeId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Saved ${channels.length} channels for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to save channels: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's channels (paginated)
   */
  async getUserChannels(
    userId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'scrapedAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    try {
      const skip = (page - 1) * limit;

      // Get user's channel IDs
      const userChannels = await this.prisma.userChannel.findMany({
        where: { userId },
        select: { channelId: true },
      });

      const channelIds = userChannels.map((uc) => uc.channelId);

      if (channelIds.length === 0) {
        return { channels: [], total: 0 };
      }

      // Get channels with pagination
      const channels = await this.prisma.channel.findMany({
        where: { id: { in: channelIds } },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      });

      const total = await this.prisma.channel.count({
        where: { id: { in: channelIds } },
      });

      return { channels, total };
    } catch (error) {
      this.logger.error(`Failed to get user channels: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's channel count
   */
  async getUserChannelCount(userId: string): Promise<number> {
    try {
      return await this.prisma.userChannel.count({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(`Failed to get user channel count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single user channel
   */
  async getUserChannel(userId: string, youtubeId: string) {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { youtubeId },
      });

      if (!channel) return null;

      // Check if user has access to this channel
      const userChannel = await this.prisma.userChannel.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId: channel.id,
          },
        },
      });

      return userChannel ? channel : null;
    } catch (error) {
      this.logger.error(`Failed to get user channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete channel from user's list
   */
  async deleteUserChannel(userId: string, channelId: string): Promise<void> {
    try {
      // Check if user owns this channel
      const userChannel = await this.prisma.userChannel.findUnique({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
      });

      if (!userChannel) {
        throw new BadRequestException('Channel not found or unauthorized');
      }

      // Delete only the user's link to the channel
      await this.prisma.userChannel.delete({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
      });

      this.logger.log(`Deleted channel for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all channels (for admin - optional)
   */
  async getAllChannels(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const channels = await this.prisma.channel.findMany({
        skip,
        take: limit,
        orderBy: { scrapedAt: 'desc' },
      });

      const total = await this.prisma.channel.count();

      return { channels, total };
    } catch (error) {
      this.logger.error(`Failed to get all channels: ${error.message}`);
      throw error;
    }
  }
}