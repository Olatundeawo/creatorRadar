import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { SearchChannelsDto } from './dto/search-channels.dto';

@Controller('api/channels')
export class ChannelsController {
  private readonly logger = new Logger(ChannelsController.name);

  constructor(private channelsService: ChannelsService) {}

  /**
   * POST /api/channels/search
   * Search YouTube for channels and save to database
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() dto: SearchChannelsDto) {
    try {
      if (!dto.query || !dto.query.trim()) {
        throw new BadRequestException('Search query is required');
      }

      this.logger.log(`Search request for: ${dto.query}`);
      const results = await this.channelsService.search(dto);

      return {
        success: true,
        message: `Found ${results.length} channels`,
        data: results,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/channels
   * Get all saved channels with pagination
   */
  @Get()
  async getChannels(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sort') sort: string = 'scrapedAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    try {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be numbers');
      }

      const result = await this.channelsService.getChannels({
        page: pageNum,
        limit: limitNum,
        sort,
        order,
      });

      return {
        success: true,
        message: `Retrieved ${result.data.length} channels`,
        ...result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get channels: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/channels/count
   * Get total number of channels
   */
  @Get('count')
  async getCount() {
    const total = await this.channelsService.getTotalCount();
    return {
      success: true,
      total,
      timestamp: new Date(),
    };
  }

  /**
   * GET /api/channels/:youtubeId
   * Get a specific channel by YouTube ID
   */
  @Get(':youtubeId')
  async getChannel(@Param('youtubeId') youtubeId: string) {
    try {
      const channel = await this.channelsService.getChannelByYoutubeId(youtubeId);

      if (!channel) {
        throw new BadRequestException(`Channel with ID ${youtubeId} not found`);
      }

      return {
        success: true,
        data: channel,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get channel: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE /api/channels/:id
   * Delete a channel
   */
  @Delete(':id')
  async deleteChannel(@Param('id') id: string) {
    try {
      const deleted = await this.channelsService.deleteChannel(id);

      return {
        success: true,
        message: 'Channel deleted successfully',
        data: deleted,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to delete channel: ${error.message}`);
      throw error;
    }
  }
}