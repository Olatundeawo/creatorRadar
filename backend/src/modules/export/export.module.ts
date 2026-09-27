import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [ChannelsModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}