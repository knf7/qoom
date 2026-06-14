import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  AuthResponse,
} from '@qoom/types';
import { Request } from 'express';
import { JwtAuthGuard } from '../security/guards/jwt.guard';
import { CurrentUser } from '../security/decorators/user.decorator';
import { ZodError } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: any,
    @Req() req: Request
  ): Promise<AuthResponse> {
    try {
      const parsed = RegisterSchema.parse(body);
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      return this.authService.register(parsed, ip, userAgent);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        throw new BadRequestException(firstIssue?.message || 'بيانات غير صالحة.');
      }
      throw err;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Req() req: Request
  ): Promise<AuthResponse> {
    try {
      const parsed = LoginSchema.parse(body);
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      return this.authService.login(parsed, ip, userAgent);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        throw new BadRequestException(firstIssue?.message || 'بيانات غير صالحة.');
      }
      throw err;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.validateUserSession(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: any) {
    try {
      const parsed = ForgotPasswordSchema.parse(body);
      return this.authService.forgotPassword(parsed.email);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        throw new BadRequestException(firstIssue?.message || 'يرجى إدخال بريد إلكتروني صالح.');
      }
      throw err;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    try {
      const parsed = ResetPasswordSchema.parse(body);
      return this.authService.resetPassword(parsed);
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        throw new BadRequestException(firstIssue?.message || 'بيانات غير صالحة.');
      }
      throw err;
    }
  }
}
