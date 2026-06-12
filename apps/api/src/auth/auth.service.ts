import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterInput, LoginInput, AuthResponse } from '@qoom/types';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private resetCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Safe registration with password hashing
   */
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const disposableDomains = ['tempmail.com', 'yopmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'dropmail.me'];
    const emailDomain = input.email.split('@')[1]?.toLowerCase();
    
    if (disposableDomains.includes(emailDomain)) {
      this.logger.warn(`Registration rejected: Disposable email detected: ${input.email}`);
      throw new ConflictException('يرجى استخدام بريد إلكتروني حقيقي (البريد المؤقت غير مسموح).');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      this.logger.warn(`Registration rejected: Email already exists: ${input.email}`);
      throw new ConflictException('An account with this email address already exists.');
    }

    // Hash password with high work factor
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Create user and log the audit event
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name || null,
        role: 'USER',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'AUTH_SIGNUP',
        ipAddress,
        userAgent,
        userId: user.id,
        details: JSON.stringify({ email: user.email }),
      },
    });

    this.logger.log(`Successful registration for user: ${user.id}`);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
      },
    };
  }

  /**
   * Verified user login
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      await this.auditFailedLogin(input.email, 'USER_NOT_FOUND', ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    const passwordValid = await bcrypt.compare(input.password, user.password);
    if (!passwordValid) {
      await this.auditFailedLogin(input.email, 'INVALID_PASSWORD', ipAddress, userAgent, user.id);
      throw new UnauthorizedException('Invalid email or password credentials.');
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'AUTH_LOGIN_SUCCESS',
        ipAddress,
        userAgent,
        userId: user.id,
      },
    });

    this.logger.log(`Successful login for user: ${user.id}`);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
      },
    };
  }

  /**
   * Fetch authenticated user model safely (without password details)
   */
  async validateUserSession(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User session is invalid.');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'USER' | 'ADMIN',
    };
  }

  private async auditFailedLogin(
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ) {
    this.logger.warn(`Failed login attempt for: ${email} - Reason: ${reason} - IP: ${ipAddress}`);
    
    await this.prisma.auditLog.create({
      data: {
        action: 'AUTH_LOGIN_FAILURE',
        ipAddress,
        userAgent,
        userId: userId || null,
        details: JSON.stringify({ email, reason }),
      },
    });
  }

  async forgotPassword(email: string): Promise<{ message: string; devCode?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return { message: 'إذا كان البريد مسجلاً لدينا، فقد تم إرسال رمز التحقق.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    this.resetCodes.set(email.toLowerCase(), { code, expiresAt });
    this.logger.log(`Password reset code generated for ${email}: ${code}`);

    return {
      message: 'تم إرسال رمز التحقق بنجاح.',
      devCode: code,
    };
  }

  async resetPassword(input: any): Promise<{ success: boolean; message: string }> {
    const email = input.email.toLowerCase();
    const record = this.resetCodes.get(email);

    if (!record) {
      throw new UnauthorizedException('رمز التحقق غير صحيح أو غير متوفر.');
    }

    if (record.code !== input.code) {
      throw new UnauthorizedException('رمز التحقق غير صحيح.');
    }

    if (new Date() > record.expiresAt) {
      this.resetCodes.delete(email);
      throw new UnauthorizedException('انتهت صلاحية رمز التحقق.');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);

    await this.prisma.user.update({
      where: { email: input.email },
      data: { password: hashedPassword },
    });

    this.resetCodes.delete(email);
    this.logger.log(`Password reset successfully for user: ${email}`);

    return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح.' };
  }
}
