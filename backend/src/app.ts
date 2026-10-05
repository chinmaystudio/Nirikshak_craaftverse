import express from 'express';
import cookieParser from 'cookie-parser';
import { securityHeaders } from './core/security/headers.js';
import { corsMiddleware } from './core/security/cors.js';
import { rateLimit } from './core/security/rateLimit.js';
import { csrfProtection } from './core/security/csrf.js';
import { requireAuthByDefault } from './core/auth/auth.middleware.js';
import { safeErrorHandler } from './core/http/errorHandler.js';
import { ApiResponseHelper } from './core/http/response.js';

// Domain Module Route Imports
import { authRouter } from './modules/auth/auth.routes.js';
import { projectsRouter } from './modules/projects/projects.routes.js';
import { procurementRouter } from './modules/procurement/procurement.routes.js';
import { progressRouter } from './modules/progress/progress.routes.js';
import { complaintsRouter } from './modules/complaints/complaints.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { contractsRouter } from './modules/contracts/contracts.routes.js';
import { milestonesRouter } from './modules/milestones/milestones.routes.js';
import { resourcesRouter } from './modules/resources/resources.routes.js';
import { financeRouter } from './modules/finance/finance.routes.js';
import { inspectionsRouter } from './modules/inspections/inspections.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { environmentRouter } from './modules/environment/environment.routes.js';
import { legalRouter } from './modules/legal/legal.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { blockchainRouter } from './modules/blockchain/blockchain.routes.js';

export const app = express();

// 1. Security Headers & Request Correlation ID
app.use(securityHeaders);

// 2. Strict CORS Configuration
app.use(corsMiddleware);

// 3. Cookie parser for HttpOnly session credentials
app.use(cookieParser());

// 4. Body parsers with payload size caps
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 5. CSRF protection on state-changing requests
app.use(csrfProtection);

// 6. Global Rate Limiter (120 req / min)
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// 7. Root service (Phase 13: Zero root advertisement, returns 404)
app.get('/', (_req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND' });
});

// 8. Internal Health Check (Phase 12 & 34: Zero-Trust Private Monitoring)
app.get('/internal/health', (req, res) => {
  const secret = req.headers?.['x-internal-secret'] || req.query?.secret;
  const configuredSecret = process.env.INTERNAL_HEALTH_SECRET;
  const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip || '');

  // In production, INTERNAL_HEALTH_SECRET is mandatory and must match
  if (process.env.NODE_ENV === 'production') {
    if (!configuredSecret || secret !== configuredSecret || !isLoopback) {
      res.status(404).json({ success: false, error: 'NOT_FOUND' });
      return;
    }
  } else {
    // In dev/test: authorized if secret matches or running in test or local loopback
    const isAuthorized = (configuredSecret && secret === configuredSecret) || (process.env.NODE_ENV === 'test') || isLoopback;
    if (!isAuthorized) {
      res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Internal diagnostics endpoint restricted.' });
      return;
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 9. Public /health lockdown (Phase 12: In production, public /health returns 404)
app.get('/health', (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ success: false, error: 'NOT_FOUND' });
    return;
  }
  res.json({ status: 'ok' });
});


// 10. Default Zero-Trust authentication guard for /api
// Automatically guards every /api route unless in AUTH_BOOTSTRAP_PUBLIC
app.use('/api', requireAuthByDefault);

// 11. Domain Module API Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tenders', procurementRouter);
app.use('/api/progress', progressRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/finance', financeRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/environment', environmentRouter);
app.use('/api/legal', legalRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/integrity', blockchainRouter);

// 12. Safe 404 Handler (no internal routing leaks)
app.use((_req, res) => {
  ApiResponseHelper.notFound(res, 'The requested resource was not found.');
});

// 13. Centralized Error Handler
app.use(safeErrorHandler);

export default app;
