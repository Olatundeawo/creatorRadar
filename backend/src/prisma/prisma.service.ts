import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 5, // Max connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Wait max 10s for a connection
    });

    const adapter = new PrismaPg(pool);

    super({ 
      adapter,
      // Prisma client options
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    this.logger.log('✅ Prisma Client initialized with PG adapter');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('❌ Prisma Client disconnected');
  }
}