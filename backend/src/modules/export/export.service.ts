import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { ChannelResponseDto } from '../channels/dto/channel.response';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Convert channels to CSV format
   */
  toCSV(channels: ChannelResponseDto[]): string {
    try {
      this.logger.log(`Converting ${channels.length} channels to CSV`);

      const fields = [
        'name',
        'subscribers',
        'videoCount',
        'email',
        'latestUpload',
        'channelUrl',
        'youtubeId',
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(channels);

      this.logger.log('✅ CSV conversion successful');
      return csv;
    } catch (error) {
      this.logger.error(`CSV conversion failed: ${error.message}`);
      throw new Error(`Failed to convert to CSV: ${error.message}`);
    }
  }

  /**
   * Convert channels to XLSX format
   */
 
    async toXLSX(channels: ChannelResponseDto[]): Promise<any> {
    try {
        this.logger.log(`Converting ${channels.length} channels to XLSX`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Channels');

        // Define columns
        worksheet.columns = [
        { header: 'Channel Name', key: 'name', width: 35 },
        { header: 'Subscribers', key: 'subscribers', width: 15 },
        { header: 'Videos', key: 'videoCount', width: 12 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Latest Upload', key: 'latestUpload', width: 20 },
        { header: 'YouTube URL', key: 'channelUrl', width: 50 },
        { header: 'YouTube ID', key: 'youtubeId', width: 30 },
        { header: 'Scraped At', key: 'scrapedAt', width: 20 },
        ];

        // Add data rows
        channels.forEach(ch => {
        worksheet.addRow({
            name: ch.name,
            subscribers: ch.subscribers,
            videoCount: ch.videoCount,
            email: ch.email || 'N/A',
            latestUpload: ch.latestUpload 
            ? new Date(ch.latestUpload).toLocaleDateString() 
            : 'N/A',
            channelUrl: ch.channelUrl,
            youtubeId: ch.youtubeId,
            scrapedAt: new Date(ch.scrapedAt).toLocaleDateString(),
        });
        });

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add borders to all cells
        worksheet.eachRow({ includeEmpty: true }, row => {
        row.eachCell(cell => {
            cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
            };
        });
        });

        // Freeze header row
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        this.logger.log('✅ XLSX conversion successful');
        return buffer;
    } catch (error) {
        this.logger.error(`XLSX conversion failed: ${error.message}`);
        throw new Error(`Failed to convert to XLSX: ${error.message}`);
    }
    }
}