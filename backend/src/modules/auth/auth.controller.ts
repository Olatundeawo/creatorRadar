import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  @Post('login')
  async login(@Body() dto: { email: string; password: string }) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const session = await this.authService.login(dto.email, dto.password);

      if (!session) {
        throw new BadRequestException('Login failed');
      }

      // Verify with backend and create user record
      const supabaseUser = await this.authService.getUserFromToken(
        session.access_token,
      );
      const user = await this.authService.upsertUser(supabaseUser);

      return {
        success: true,
        user,
        token: session.access_token,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/auth/signup
   * Sign up with email and password
   */
  @Post('signup')
  async signup(
    @Body() dto: { email: string; password: string; name?: string },
  ) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const supabaseUser = await this.authService.signup(
        dto.email,
        dto.password,
        dto.name,
      );

      // Create user in our database
      const user = await this.authService.upsertUser(supabaseUser);

      return {
        success: true,
        user,
        message: 'Signup successful. Please login to continue.',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Signup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/auth/verify
   * Verify Supabase token and get/create user
   */
  @Post('verify')
  async verify(@Body('token') token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token is required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);

      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      // Create or update user in our database
      const user = await this.authService.upsertUser(supabaseUser);

      return {
        success: true,
        user,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Verify failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/auth/save-search
   * Save a search query
   */
  @Post('save-search')
  async saveSearch(
    @Headers('authorization') authHeader: string,
    @Body() dto: { query: string; niche?: string; resultCount?: number },
  ) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization token required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const search = await this.authService.saveSearch(
        supabaseUser.id,
        dto.query,
        dto.niche,
        dto.resultCount,
      );

      return {
        success: true,
        data: search,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Save search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/auth/searches
   * Get user's search history
   */
  @Get('searches')
  async getSearches(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization token required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      const searches = await this.authService.getUserSearches(supabaseUser.id);

      return {
        success: true,
        data: searches,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Get searches failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * DELETE /api/auth/searches/:id
   * Delete a search
   */
  @Delete('searches/:id')
  async deleteSearch(
    @Headers('authorization') authHeader: string,
    @Param('id') searchId: string,
  ) {
    try {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        throw new BadRequestException('Authorization token required');
      }

      const supabaseUser = await this.authService.getUserFromToken(token);
      if (!supabaseUser) {
        throw new BadRequestException('Invalid token');
      }

      await this.authService.deleteSearch(supabaseUser.id, searchId);

      return {
        success: true,
        message: 'Search deleted',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Delete search failed: ${error.message}`);
      throw error;
    }
  }
}