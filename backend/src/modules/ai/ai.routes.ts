import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const aiRouter = Router();

// GET /api/ai/health - AI service status
aiRouter.get('/health', (req, res, next) => aiController.health(req, res, next));

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
