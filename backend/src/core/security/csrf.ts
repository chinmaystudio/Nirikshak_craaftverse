import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe methods do not require CSRF token validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt auth bootstrap public endpoints from CSRF check
  const path = req.path;
  if (
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/register') ||
    path.startsWith('/api/auth/forgot-password') ||
    path.startsWith('/api/auth/reset-password') ||
    path.startsWith('/api/auth/csrf')
  ) {
    return next();
  }

  // Verify Origin / Referer for state-changing requests
  const origin = req.headers['origin'] as string;
  const referer = req.headers['referer'] as string;
  const allowedOrigins = env.ALLOWED_ORIGINS;

  if (origin && !allowedOrigins.includes(origin)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      code: 'CSRF_ORIGIN_MISMATCH',
      message: 'Cross-origin state-changing requests are strictly forbidden.',
    });
    return;
  }

  if (!origin && referer) {
    const refererOrigin = new URL(referer).origin;
    if (!allowedOrigins.includes(refererOrigin)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'CSRF_REFERER_MISMATCH',
        message: 'Invalid referer origin.',
      });
      return;
    }
  }

  // If request uses cookie session, require valid x-csrf-token
  const sessionCookie = req.cookies?.['nirikshak_session'];
  if (sessionCookie) {
    const csrfHeader = req.headers['x-csrf-token'] as string;
    const expectedCsrf = req.cookies?.['nirikshak_csrf'];

    if (!csrfHeader || !expectedCsrf || csrfHeader !== expectedCsrf) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'CSRF_TOKEN_INVALID',
        message: 'State-changing request rejected: Missing or invalid CSRF verification token.',
      });
      return;
    }
  }

  next();
}
