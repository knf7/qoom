import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { env } from '../../config/env.config';
import Redis from 'ioredis';

@Injectable()
export class AuthRateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthRateLimiterMiddleware.name);
  private limiter: RateLimiterRedis | RateLimiterMemory;

  constructor() {
    try {
      const redisClient = new Redis(env.REDIS_URL, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });

      // Strict rate limiting for auth endpoints: 10 requests per 5 minutes per IP
      const rateLimitsOpts = {
        points: 10,
        duration: 5 * 60, // 5 minutes
        blockDuration: 10 * 60, // block for 10 minutes if exceeded
      };

      redisClient.on('error', () => {
        this.limiter = new RateLimiterMemory(rateLimitsOpts);
      });

      this.limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'auth_rate_limit',
        ...rateLimitsOpts,
      });
    } catch (error) {
      this.limiter = new RateLimiterMemory({
        points: 10,
        duration: 5 * 60,
        blockDuration: 10 * 60,
      });
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.endsWith('127.0.0.1') ||
      ip.endsWith('::1')
    ) {
      return next();
    }

    try {
      await this.limiter.consume(ip);
      next();
    } catch (rejRes) {
      this.logger.warn(`Auth Rate limit exceeded for IP: ${ip} on path ${req.method} ${req.path}`);
      
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'تم تجاوز الحد المسموح لمحاولات تسجيل الدخول. يرجى المحاولة بعد 10 دقائق.',
      });
    }
  }
}
