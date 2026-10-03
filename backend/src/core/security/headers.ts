import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Generate request correlation ID
  const incomingId = req.header('x-request-id');
  const correlationId = incomingId && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId)
    ? incomingId
    : crypto.randomUUID();

  res.setHeader('X-Request-Id', correlationId);
  (req as any).id = correlationId;

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove Express footprint
  res.removeHeader('X-Powered-By');
  next();
}
