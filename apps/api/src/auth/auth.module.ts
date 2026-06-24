import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { env } from '../config/env.config';
import { JwtAuthGuard } from '../security/guards/jwt.guard';
import { RateLimitGuard } from '../security/guards/rate-limit.guard';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '7d' }, // Session active for 7 days
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RateLimitGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
