import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const aiRouter = Router();

// AI service health is internal-only; public /api/ai/health removed

// POST /api/ai/analyze/:projectId - Trigger advisory AI project risk analysis
aiRouter.post(
  '/analyze/:projectId',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  (req, res, next) => aiController.analyze(req, res, next)
);

// POST /api/ai/feedback - Submit government review feedback on AI recommendations
aiRouter.post(
  '/feedback',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => aiController.feedback(req, res, next)
);

// POST /api/ai/outcome - Record verified operational outcome and trigger single RL policy update
aiRouter.post(
  '/outcome',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => aiController.outcome(req, res, next)
);

// POST /api/ai/assistant - NIRIKSHAK Civic Assistant powered by Google Gemini 3.1 Pro
aiRouter.post(
  '/assistant',
  rateLimit({ windowMs: 60 * 1000, max: 40 }),
  (req, res, next) => aiController.assistant(req, res, next)
);

