import { Controller, Get, Query, Res, Logger, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ChannelsService } from '../channels/channels.service';

@Controller('api/export')
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(
    private exportService: ExportService,
    private channelsService: ChannelsService,
  ) {}

  /**
   * GET /api/export/channels
   * Export all channels to CSV or XLSX
   */
  @Get('channels')
  async exportChannels(
    @Query('format') format: 'csv' | 'xlsx' = 'xlsx',
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Export request - Format: ${format}`);

      // Get all channels from database
      const channels = await this.channelsService.getAllChannels();

      if (channels.length === 0) {
        throw new BadRequestException('No channels found to export');
      }

      this.logger.log(`Exporting ${channels.length} channels as ${format.toUpperCase()}`);

      if (format === 'csv') {
        // Export as CSV
        const csv = this.exportService.toCSV(channels);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="channels_${new Date().toISOString().split('T')[0]}.csv"`,
        );
        return res.send(csv);
      }

      if (format === 'xlsx') {
        // Export as XLSX
        const buffer = await this.exportService.toXLSX(channels);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="channels_${new Date().toISOString().split('T')[0]}.xlsx"`,
        );
        return res.send(buffer);
      }

      throw new BadRequestException('Format must be "csv" or "xlsx"');
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/export/search/:query
   * Export channels from a specific search to CSV or XLSX
   */
  @Get('search/:query')
  async exportSearchResults(
    @Query('query') query: string,
    @Query('format') format: 'csv' | 'xlsx' = 'xlsx',
    @Res() res: Response,
  ) {
    try {
      if (!query) {
        throw new BadRequestException('Query parameter is required');
      }

      this.logger.log(`Export search results - Query: ${query}, Format: ${format}`);

      // Get channels matching the search (from database)
      // This searches channels that were previously scraped with this query
      const result = await this.channelsService.getChannels({
        page: 1,
        limit: 1000, // Get up to 1000 results
      });

      const channels = result.data;

      if (channels.length === 0) {
        throw new BadRequestException(
          `No channels found for query: ${query}. Please search first.`,
        );
      }

      this.logger.log(`Exporting ${channels.length} channels as ${format.toUpperCase()}`);

      if (format === 'csv') {
        const csv = this.exportService.toCSV(channels);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${query}_${new Date().toISOString().split('T')[0]}.csv"`,
        );
        return res.send(csv);
      }

      if (format === 'xlsx') {
        const buffer = await this.exportService.toXLSX(channels);

        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${query}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        );
        return res.send(buffer);
      }

      throw new BadRequestException('Format must be "csv" or "xlsx"');
    } catch (error) {
      this.logger.error(`Export search failed: ${error.message}`);
      throw error;
    }
  }
}