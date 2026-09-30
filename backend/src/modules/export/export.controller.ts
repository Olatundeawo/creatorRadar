import {
  Controller,
  Get,
  Query,
  Headers,
  BadRequestException,
  Logger,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ChannelsService } from '../channels/channels.service';
import { AuthService } from '../auth/auth.service';

@Controller('api/export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(
    private exportService: ExportService,
    private channelsService: ChannelsService,
    private authService: AuthService,
  ) {}

  /**
   * GET /api/export/channels?format=csv|xlsx
   */
  @Get('channels')
  async exportChannels(
    @Headers('authorization') authHeader: string,
    @Query('format') format: string = 'csv',
    @Res() res: Response,
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

      // Get user's channels
      const { channels } = await this.channelsService.getUserChannels(
        supabaseUser.id,
        1,
        1000,
      );

      if (channels.length === 0) {
        return res.status(400).json({ error: 'No channels to export' });
      }

      this.logger.log(
        `Exporting ${channels.length} channels as ${format.toUpperCase()}`,
      );

      if (format.toLowerCase() === 'xlsx') {
        const buffer = await this.exportService.toXLSX(channels);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="channels.xlsx"');
        return res.send(buffer);
      } else {
        const csv = this.exportService.toCSV(channels);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="channels.csv"');
        return res.send(csv);
      }
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/export/search/:query?format=csv|xlsx
   */
  @Get('search/:query')
  async exportSearch(
    @Headers('authorization') authHeader: string,
    @Query('query') query: string,
    @Query('format') format: string = 'csv',
    @Res() res: Response,
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

      // Get user's channels
      const { channels } = await this.channelsService.getUserChannels(
        supabaseUser.id,
        1,
        1000,
      );

      if (channels.length === 0) {
        return res.status(400).json({ error: 'No channels to export' });
      }

      this.logger.log(
        `Exporting ${channels.length} channels as ${format.toUpperCase()}`,
      );

      if (format.toLowerCase() === 'xlsx') {
        const buffer = await this.exportService.toXLSX(channels);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="channels.xlsx"');
        return res.send(buffer);
      } else {
        const csv = this.exportService.toCSV(channels);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="channels.csv"');
        return res.send(csv);
      }
    } catch (error) {
      this.logger.error(`Export search failed: ${error.message}`);
      throw error;
    }
  }
}