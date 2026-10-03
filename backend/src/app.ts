import express from 'express';
import { securityHeaders } from './core/security/headers.js';
import { corsMiddleware } from './core/security/cors.js';
import { rateLimit } from './core/security/rateLimit.js';
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

export const app = express();

// 1. Security Headers & Request Correlation ID
app.use(securityHeaders);

// 2. Strict CORS Configuration
app.use(corsMiddleware);

// 3. Body parsers with payload size caps
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Global Rate Limiter (120 req / min)
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// 5. Root service identity (no leaked metadata)
app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>NIRIKSHAK Backend Service</title>
  <style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07111f;color:#e7eef8;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(92vw,560px);padding:42px;border:1px solid #25364d;border-radius:20px;background:linear-gradient(145deg,#101e31,#0a1626);box-shadow:0 24px 70px #0008;text-align:center}.mark{width:58px;height:58px;margin:0 auto 20px;display:grid;place-items:center;border-radius:16px;background:#eefc55;color:#07111f;font-size:30px;font-weight:900}h1{margin:0;font-size:clamp(24px,5vw,38px);letter-spacing:.04em}p{margin:14px auto 0;max-width:420px;color:#aebed3;line-height:1.6}.status{display:inline-flex;align-items:center;gap:8px;margin-top:26px;padding:8px 13px;border:1px solid #294c44;border-radius:999px;background:#102a27;color:#9ce8ce;font-size:13px;font-weight:700}.dot{width:8px;height:8px;border-radius:50%;background:#48d6a4;box-shadow:0 0 14px #48d6a4}</style>
</head>
<body><main class="card"><div class="mark">N</div><h1>NIRIKSHAK</h1><p>Secure backend services for infrastructure monitoring and public accountability.</p><div class="status"><span class="dot"></span>Service operational</div></main></body>
</html>`);
});

// 6. Hardened Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 7. Domain Module API Routes
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

// 8. Safe 404 Handler (no internal routing leaks)
app.use((_req, res) => {
  ApiResponseHelper.notFound(res, 'The requested resource was not found.');
});

// 9. Centralized Error Handler
app.use(safeErrorHandler);

export default app;
