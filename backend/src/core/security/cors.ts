import cors from 'cors';
import { env } from '../config/env.js';

const defaultDevelopmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
];

// The production frontend is a fixed Cloudflare Pages origin. Keep it in the
// server allowlist so a missing/stale Render ALLOWED_ORIGINS value cannot turn
// browser authentication into an opaque "Failed to fetch" error.
const productionOrigins = ['https://nirikshak-craftverse.pages.dev'];

const configuredOrigins = env.ALLOWED_ORIGINS
  ? [...productionOrigins, ...env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)]
  : env.NODE_ENV === 'production' ? productionOrigins : defaultDevelopmentOrigins;

if (env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be configured in production');
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin)) {
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
});
