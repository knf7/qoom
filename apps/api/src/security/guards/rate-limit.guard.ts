import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Decorator to set rate limit on a specific route.
 * @param limit - Max number of requests
 * @param windowMs - Time window in milliseconds
 */
export const RateLimit = (limit: number, windowMs: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, windowMs });

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter guard.
 * Tracks requests per IP per route and rejects when limit exceeded.
 * Uses a simple Map with periodic cleanup.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  // Key: `ip:route` → entry
  private readonly store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.get<{ limit: number; windowMs: number }>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no @RateLimit decorator, allow through
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const route = `${request.method}:${request.route?.path || request.url}`;
    const key = `${ip}:${route}`;
    const now = Date.now();

    // Periodic cleanup of expired entries
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup(now);
      this.lastCleanup = now;
    }

    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // First request or window expired — start fresh
      this.store.set(key, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    if (entry.count >= config.limit) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        `تم تجاوز الحد المسموح. يرجى المحاولة بعد ${retryAfterSec} ثانية.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }

  private cleanup(now: number) {
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
