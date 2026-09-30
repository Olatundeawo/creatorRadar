import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ChannelsModule } from '../channels/channels.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ChannelsModule, AuthModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}