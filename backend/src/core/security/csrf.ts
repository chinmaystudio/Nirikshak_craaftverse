import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/csrf',
]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe methods do not require CSRF token validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exact path matching for CSRF exemptions (No prefix wildcards)
  const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  if (CSRF_EXEMPT_PATHS.has(fullPath) || CSRF_EXEMPT_PATHS.has(req.path)) {
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
    try {
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
    } catch {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'CSRF_REFERER_INVALID',
        message: 'Malformed referer URL.',
      });
      return;
    }
  }

  // If request uses cookie session, require valid x-csrf-token matching bound cookie
  const sessionCookie = req.cookies?.['nirikshak_session'];
  if (sessionCookie) {
    const csrfHeader = req.headers['x-csrf-token'] as string;
    const expectedCsrf = req.cookies?.['nirikshak_csrf'];

    if (!csrfHeader || !expectedCsrf || !timingSafeEqualStr(csrfHeader, expectedCsrf)) {
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
