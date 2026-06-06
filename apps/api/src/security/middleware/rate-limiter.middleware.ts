import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { env } from '../../config/env.config';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimiterMiddleware.name);
  private limiter: RateLimiterRedis | RateLimiterMemory;

  constructor() {
    try {
      const redisClient = new Redis(env.REDIS_URL, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });

      // Default rate limiting configuration: 500 requests per 15 minutes per IP
      const rateLimitsOpts = {
        points: 500,
        duration: 15 * 60, // 15 minutes in seconds
        blockDuration: 2 * 60, // block for 2 minutes if exceeded
      };

      redisClient.on('error', () => {
        // Enforce fallback instantly
        this.limiter = new RateLimiterMemory(rateLimitsOpts);
      });

      this.limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rate_limit',
        ...rateLimitsOpts,
      });

      this.logger.log('Rate limiter configured with Redis backend store.');
    } catch (error) {
      this.logger.warn('Failed to connect rate limiter to Redis. Falling back to memory storage.');
      this.limiter = new RateLimiterMemory({
        points: 500,
        duration: 15 * 60,
        blockDuration: 2 * 60,
      });
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    // Bypass rate limiting for localhost / loopback addresses
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
      this.logger.warn(`Rate limit exceeded for IP: ${ip} on path ${req.method} ${req.path}`);
      
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        timestamp: new Date().toISOString(),
        path: req.url,
        message: 'Too many requests. Please slow down and try again in a few minutes.',
      });
    }
  }
}
