import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY not set');
    }

    // Use ws for Node.js 20
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        transport: ws as any,
      },
      global: {
        headers: {
          'User-Agent': 'CreatorRadar-API',
        },
      },
    });

    this.logger.log('✅ Supabase client initialized');
  }


  /**
   * Get user from Supabase token
   */
  async getUserFromToken(token: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      return data.user;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Login with email/password
   */
  async login(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Supabase returns 400 for invalid credentials
      if (error) {
        // Check if it's "Invalid login credentials" (user doesn't exist or wrong password)
        if (error.message.includes('Invalid') || error.status === 400) {
          throw new BadRequestException(
            'Email not found or password incorrect. Please check credentials.',
          );
        }
        throw new BadRequestException(error.message || 'Login failed');
      }

      return data.session;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign up with email/password
   */
  async signup(email: string, password: string, name?: string) {
    try {
      // Check if user already exists in Supabase auth
      const { data: existingUser, error: checkError } =
        await this.supabase.auth.admin.listUsers();

      // For regular client, we'll catch the error from signup
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        // Supabase returns this message if email already registered
        if (error.message.includes('already registered')) {
          throw new BadRequestException(
            'Email already registered. Please login instead.',
          );
        }
        throw new BadRequestException(error.message || 'Signup failed');
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create or update user in database
   */
  async upsertUser(supabaseUser: any) {
    try {
      const user = await this.prisma.user.upsert({
        where: { id: supabaseUser.id },
        update: {
          name: supabaseUser.user_metadata?.full_name || null,
        },
        create: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || null,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Failed to upsert user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save search for user
   */
  async saveSearch(userId: string, query: string, niche?: string, resultCount?: number) {
    try {
      const search = await this.prisma.savedSearch.create({
        data: {
          userId,
          query,
          niche: niche || 'general',
          resultCount: resultCount || 0,
        },
      });

      this.logger.log(`✅ Saved search for user ${userId}: ${query}`);
      return search;
    } catch (error) {
      this.logger.error(`Failed to save search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's search history
   */
  async getUserSearches(userId: string) {
    try {
      const searches = await this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return searches;
    } catch (error) {
      this.logger.error(`Failed to get searches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete search
   */
  async deleteSearch(userId: string, searchId: string) {
    try {
      const search = await this.prisma.savedSearch.findUnique({
        where: { id: searchId },
      });

      if (!search || search.userId !== userId) {
        throw new BadRequestException('Search not found or unauthorized');
      }

      await this.prisma.savedSearch.delete({
        where: { id: searchId },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete search: ${error.message}`);
      throw error;
    }
  }
}