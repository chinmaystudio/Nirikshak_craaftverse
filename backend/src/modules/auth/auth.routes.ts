import { Router } from 'express';
import { authController } from './auth.controller.js';
import { rateLimit } from '../../core/security/rateLimit.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';

export const authRouter = Router();

// GET /api/auth/csrf - Fetch CSRF token
authRouter.get(
  '/csrf',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  (req, res) => authController.getCsrf(req, res)
);

// POST /api/auth/login - Strict rate-limited identity endpoint
authRouter.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
  }),
  (req, res, next) => authController.login(req, res, next)
);

// POST /api/auth/logout - Session revocation
authRouter.post(
  '/logout',
  (req, res) => authController.logout(req, res)
);

// GET /api/auth/session - Authenticated user context
authRouter.get(
  '/session',
  requireAuth,
  (req, res) => authController.getSession(req, res)
);

// POST /api/auth/forgot-password - Password recovery
authRouter.post(
  '/forgot-password',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

// POST /api/auth/reset-password - Password reset execution
authRouter.post(
  '/reset-password',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  (req, res, next) => authController.resetPassword(req, res, next)
);

// POST /api/auth/register - Self-registration
authRouter.post(
  '/register',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: 'Too many registration attempts. Please wait 15 minutes and try again.',
  }),
  (req, res, next) => authController.register(req, res, next)
);

// MFA Routes
authRouter.post(
  '/mfa/enroll',
  requireAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  (req, res, next) => authController.enrollMfa(req, res, next)
);

authRouter.post(
  '/mfa/verify',
  requireAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 15 }),
  (req, res, next) => authController.verifyMfa(req, res, next)
);

authRouter.post(
  '/mfa/unenroll',
  requireAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  (req, res, next) => authController.unenrollMfa(req, res, next)
);

authRouter.get(
  '/mfa/status',
  requireAuth,
  (req, res, next) => authController.getMfaStatus(req, res, next)
);
