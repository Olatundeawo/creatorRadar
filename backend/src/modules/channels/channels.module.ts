import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScraperModule } from '../scraper/scraper.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
  imports: [PrismaModule, ScraperModule], // Import Prisma to use in this module
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService], // Export so other modules can use it
})
export class ChannelsModule {}