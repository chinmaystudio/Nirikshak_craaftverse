import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const aiRouter = Router();

// POST /api/ai/analyze/:projectId - Trigger advisory AI project risk analysis
aiRouter.post(
  '/analyze/:projectId',
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  requireAuth,
  (req, res, next) => aiController.analyze(req, res, next)
);
