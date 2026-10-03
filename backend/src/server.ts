import { env } from './core/config/env.js';
import { app } from './app.js';

const PORT = env.PORT;
const isTest = env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));

if (!process.env.VERCEL && !isTest) {
  const server = app.listen(PORT, () => {
    console.log(`[NIRIKSHAK] Backend API listening on port ${PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`[NIRIKSHAK] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[NIRIKSHAK] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
