import type { RequestHandler } from 'express';
import { ApiResponse, HttpStatus } from '../utils/api-response.js';

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  maxKeys?: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export const createRateLimit = ({ maxRequests, windowMs, maxKeys = 10_000 }: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, RateLimitBucket>();
  let nextSweepAt = Date.now() + windowMs;

  return (req, res, next) => {
    const now = Date.now();

    if (now >= nextSweepAt) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(key);
        }
      }
      nextSweepAt = now + windowMs;
    }

    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const key = !buckets.has(clientKey) && buckets.size >= maxKeys ? '__overflow__' : clientKey;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    res.setHeader('RateLimit-Limit', maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - bucket.count - 1));
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (bucket.count >= maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      res.status(HttpStatus.TOO_MANY_REQUESTS).json(
        ApiResponse({
          success: false,
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          error: { code: 'RATE_LIMITED' }
        })
      );
      return;
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    next();
  };
};
