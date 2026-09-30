import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { ExportModule } from './modules/export/export.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database module
    PrismaModule,
    // Feature modules
    ChannelsModule,
    ScraperModule,
    ExportModule,
    AuthModule,
  ],
})
export class AppModule {}