import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Headers,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { AuthService } from '../auth/auth.service';
import { ScraperService } from '../scraper/scraper.service';

@Controller('api/channels')
export class ChannelsController {
  private readonly logger = new Logger(ChannelsController.name);

  constructor(
    private channelsService: ChannelsService,
    private authService: AuthService,
    private scraperService: ScraperService,
  ) {}

  /**
   * POST /api/channels/search
   */
  @Post('search')
  async search(
    @Headers('authorization') authHeader: string,
    @Body() dto: { query: string; niche?: string; maxResults?: number },
  ) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const { query, niche, maxResults = 10 } = dto;

      // Search YouTube
      const channels = await this.channelsService.search(
        query,
        niche,
        maxResults,
      );

      // Save channels for this user
      await this.channelsService.saveChannelsForUser(
        supabaseUser.id,
        channels,
        query,
        niche,
        channels.length,
      );

      // Get quota info
      const quota = this.scraperService.getQuotaInfo();

      return {
        success: true,
        data: channels,
        count: channels.length,
        quota,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/channels/quota
   */
  @Get('quota')
  async getQuota(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const quota = this.scraperService.getQuotaInfo();

      return {
        success: true,
        data: quota,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Get quota failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/channels
   * Get user's channels (paginated)
   */
    @Get()
  async getChannels(
    @Headers('authorization') authHeader: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort = 'scrapedAt',
    @Query('order') order = 'desc',
  ) {
    try {
      // Get user from token
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
      const orderBy = (order === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

      const { channels, total } = await this.channelsService.getUserChannels(
        supabaseUser.id,
        pageNum,
        limitNum,
        sort,
        orderBy,
      );

      return {
        success: true,
        data: channels,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Get channels failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * GET /api/channels/count
   * Get user's total channel count
   */
  @Get('count')
  async getCount(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const count = await this.channelsService.getUserChannelCount(
        supabaseUser.id,
      );

      return {
        success: true,
        count,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Get count failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/channels/:youtubeId
   * Get single channel
   */
  @Get(':youtubeId')
  async getChannel(
    @Headers('authorization') authHeader: string,
    @Param('youtubeId') youtubeId: string,
  ) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const channel = await this.channelsService.getUserChannel(
        supabaseUser.id,
        youtubeId,
      );

      if (!channel) {
        throw new BadRequestException('Channel not found');
      }

      return {
        success: true,
        data: channel,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Get channel failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE /api/channels/:id
   * Delete channel from user's list
   */
  @Delete(':id')
  async deleteChannel(
    @Headers('authorization') authHeader: string,
    @Param('id') channelId: string,
  ) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      await this.channelsService.deleteUserChannel(supabaseUser.id, channelId);

      return {
        success: true,
        message: 'Channel deleted',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Delete channel failed: ${error.message}`);
      throw error;
    }
  }
}