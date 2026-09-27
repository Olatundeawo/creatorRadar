import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ScraperService } from '../scraper/scraper.service';
import { SearchChannelsDto } from './dto/search-channels.dto';
import { ChannelResponseDto } from './dto/channel.response';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaService,
    private scraperService: ScraperService,
    private configService: ConfigService,
  ) {}

  /**
   * Search YouTube for channels and save them to database
   */
  async search(dto: SearchChannelsDto): Promise<ChannelResponseDto[]> {
    try {
      this.logger.log(`🔍 Searching and scraping YouTube for: ${dto.query}`);

      // Step 1: Search YouTube and enrich data
      const enrichedChannels = await this.scraperService.searchAndEnrich(
        dto.query,
        dto.maxResults || 50,
      );

      if (enrichedChannels.length === 0) {
        this.logger.log(`No channels found for: ${dto.query}`);
      }

      // Step 2: Save to database
      const savedChannels = await this.saveChannels(enrichedChannels);

      // Step 3: Log search query
      await this.prisma.searchQuery.create({
        data: {
          query: dto.query,
          niche: dto.niche || 'general',
          resultCount: savedChannels.length,
        },
      });

      this.logger.log(`✅ Saved ${savedChannels.length} channels to database`);
      return savedChannels;
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

      if (page < 1 || limit < 1) {
        throw new Error('Page and limit must be greater than 0');
      }

      const skip = (page - 1) * limit;

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
   * Save channels to database (upsert)
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
              email: ch.email || null,
              latestUpload: ch.latestUpload,
              thumbnailUrl: ch.thumbnailUrl,
              channelUrl: ch.channelUrl,
            },
            create: {
              youtubeId: ch.youtubeId,
              name: ch.name,
              description: ch.description || null,
              subscribers: ch.subscribers,
              videoCount: ch.videoCount,
              email: ch.email || null,
              latestUpload: ch.latestUpload,
              thumbnailUrl: ch.thumbnailUrl,
              channelUrl: ch.channelUrl,
            },
          }),
        ),
      );

      this.logger.log(`✅ Saved ${saved.length} channels to database`);
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

  async getAllChannels(): Promise<ChannelResponseDto[]> {
  return this.prisma.channel.findMany({
    orderBy: { scrapedAt: 'desc' },
  });
}
}