import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { securityHeaders, rateLimit, safeErrorHandler } from './middleware/security.js';
import { projectsRouter } from './routes/projects.js';
import { progressRouter } from './routes/progress.js';
import { complaintsRouter } from './routes/complaints.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { tendersRouter } from './routes/tenders.js';

export const app = express();
export default app;

// 1. HTTP Security Headers & Correlation ID (Rules 38, 73, 98, 100)
app.use(securityHeaders);

// 2. Strict CORS Configuration (Rule 37)
const defaultDevelopmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : process.env.NODE_ENV === 'production' ? [] : defaultDevelopmentOrigins;
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be configured in production');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server or curl in dev)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const error = Object.assign(new Error('Origin not permitted by CORS policy'), {
          status: 403,
          code: 'CORS_ORIGIN_DENIED',
        });
        callback(error);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// 3. Request Body Limits (Rule 39: Limit JSON request size to 2MB)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Global Rate Limiter (Rule 40: 120 requests per minute)
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// 5. Public service identity page. It intentionally exposes no routes, versions,
// environment values, database details, or operational metadata.
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

// 6. Hardened Health Check (Rule 99: strictly return status: ok without leaking internal env/db info)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

// 7. API Route Handlers
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tenders', tendersRouter);
app.use('/api/progress', progressRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/ai', aiRouter);

// 8. Do not expose Express's default HTML 404 page or route internals.
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  });
});

// 9. Centralized Safe Error Handler (Rule 73)
app.use(safeErrorHandler);

const PORT = Number(process.env.PORT) || 4000;
const isTest = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));
if (!process.env.VERCEL && !isTest) {
  app.listen(PORT, () => {
    console.log(`NIRIKSHAK Backend API listening on port ${PORT}`);
  });
}
