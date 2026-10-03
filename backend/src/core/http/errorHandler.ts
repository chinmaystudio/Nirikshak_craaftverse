import { Request, Response, NextFunction } from 'express';
import { AppError } from '../http/errors.js';
import { ApiResponseHelper } from '../http/response.js';

export function safeErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const correlationId = res.getHeader('X-Request-Id');

  // Log full error details safely to server logs (never expose to caller)
  console.error('[SafeErrorHandler]', {
    correlationId,
    name: err?.name,
    code: err?.code,
    status: err?.status || err?.statusCode,
    message: err?.message,
    stack: !isProd ? err?.stack : undefined,
  });

  if (err instanceof AppError) {
    ApiResponseHelper.error(res, err.code, err.message, err.statusCode);
    return;
  }

  // Handle specific known error structures (e.g. CORS or Zod errors)
  if (err?.code === 'CORS_ORIGIN_DENIED') {
    ApiResponseHelper.forbidden(res, 'Cross-origin request not permitted by policy');
    return;
  }

  if (err?.name === 'ZodError') {
    const firstIssue = err.issues?.[0]?.message || 'Validation error';
    ApiResponseHelper.validationError(res, firstIssue);
    return;
  }

  const status = Number(err?.status || err?.statusCode) || 500;
  const message = isProd
    ? 'An internal error occurred while processing your request'
    : err?.message || 'Internal server error';

  ApiResponseHelper.error(res, 'INTERNAL_ERROR', message, status);
}
