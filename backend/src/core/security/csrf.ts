import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { isAllowedOrigin } from './cors.js';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const CSRF_TOKEN_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/csrf',
  '/api/auth/oauth/google/start',
  '/api/auth/oauth/google/callback',
  '/api/ai/assistant',
  '/api/ai/suggest-contractor',
]);

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP verbs do not mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;

  // 1. Mandatory Origin / Referer verification for ALL mutating browser requests
  const origin = req.headers['origin'] as string;
  const referer = req.headers['referer'] as string;
  // Check if request is authenticated via internal service secret (machine-to-machine)
  const isInternalService = req.headers['x-internal-service-secret'] === process.env.INTERNAL_HEALTH_SECRET;

  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'CSRF_ORIGIN_MISMATCH',
        message: 'Cross-origin state-changing requests are strictly forbidden.',
      });
      return;
    }
  } else if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!isAllowedOrigin(refererOrigin)) {
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
  } else {
    // Fail-closed in production if neither Origin nor Referer is provided
    if (process.env.NODE_ENV === 'production' && !isInternalService) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        code: 'CSRF_ORIGIN_REQUIRED',
        message: 'State-changing requests must include a valid Origin or Referer header.',
      });
      return;
    }
  }

  // 2. Token exemption check for unauthenticated bootstrap endpoints (AFTER Origin verification)
  if (CSRF_TOKEN_EXEMPT_PATHS.has(fullPath) || CSRF_TOKEN_EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  // 3. For session-based requests, validate double-submit cookie & header
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
