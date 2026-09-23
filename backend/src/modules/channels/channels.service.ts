import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchChannelsDto } from './dto/search-channels.dto';
import { ChannelResponseDto } from './dto/channel.response';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Search YouTube for channels and save them to database
   */
  async search(dto: SearchChannelsDto): Promise<ChannelResponseDto[]> {
    try {
      this.logger.log(`Searching YouTube for: ${dto.query}`);

      // For now, return empty array
      // We'll implement YouTube API integration in Scraper module
      const channels = [];

      // Save search query to track user searches
      await this.prisma.searchQuery.create({
        data: {
          query: dto.query,
          niche: dto.niche || 'general',
          resultCount: channels.length,
        },
      });

      return channels;
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get all channels from database with pagination
   */
  async getChannels(options: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<{
    data: ChannelResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const sort = options.sort || 'scrapedAt';
      const order = options.order || 'desc';

      // Validate pagination
      if (page < 1 || limit < 1) {
        throw new Error('Page and limit must be greater than 0');
      }

      const skip = (page - 1) * limit;

      // Fetch channels and total count in parallel
      const [channels, total] = await Promise.all([
        this.prisma.channel.findMany({
          skip,
          take: limit,
          orderBy: {
            [sort]: order,
          },
        }),
        this.prisma.channel.count(),
      ]);

      return {
        data: channels,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get channels: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Get a single channel by YouTube ID
   */
  async getChannelByYoutubeId(youtubeId: string): Promise<ChannelResponseDto | null> {
    return this.prisma.channel.findUnique({
      where: { youtubeId },
    });
  }

  /**
   * Save channels to database (used after scraping)
   */
  async saveChannels(channels: any[]): Promise<ChannelResponseDto[]> {
    try {
      const saved = await Promise.all(
        channels.map(ch =>
          this.prisma.channel.upsert({
            where: { youtubeId: ch.youtubeId },
            update: {
              name: ch.name,
              description: ch.description,
              subscribers: ch.subscribers,
              videoCount: ch.videoCount,
              email: ch.email,
              latestUpload: ch.latestUpload,
              thumbnailUrl: ch.thumbnailUrl,
              channelUrl: ch.channelUrl,
            },
            create: {
              youtubeId: ch.youtubeId,
              name: ch.name,
              description: ch.description,
              subscribers: ch.subscribers,
              videoCount: ch.videoCount,
              email: ch.email,
              latestUpload: ch.latestUpload,
              thumbnailUrl: ch.thumbnailUrl,
              channelUrl: ch.channelUrl,
            },
          }),
        ),
      );

      this.logger.log(`Saved ${saved.length} channels to database`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to save channels: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(id: string): Promise<ChannelResponseDto> {
    return this.prisma.channel.delete({
      where: { id },
    });
  }

  /**
   * Get total channel count
   */
  async getTotalCount(): Promise<number> {
    return this.prisma.channel.count();
  }
}