import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * In-memory token bucket / sliding window rate limiter (Rule 40).
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.', keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = keyGenerator ? keyGenerator(req) : `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (record.count >= max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message },
      });
      return;
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    next();
  };
}

/**
 * Standard HTTP Security Headers (Rules 38, 98, 100).
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Attach correlation ID (Rule 73)
  const requestId = req.header('x-request-id') || crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Safe error handling middleware to sanitize internal errors (Rule 73).
 */
export function safeErrorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req as any).requestId || crypto.randomUUID();
  console.error(`[ERROR][${requestId}]`, {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.status || err.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (isClientError ? 'CLIENT_ERROR' : 'INTERNAL_ERROR'),
      message: isClientError ? err.message : 'An unexpected error occurred. Please quote the correlation ID.',
      requestId,
    },
  });
}
