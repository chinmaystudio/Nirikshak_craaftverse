import { Router } from 'express';
import { progressController } from './progress.controller.js';
import { requireAuth, requireContractor, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const progressRouter = Router();

// GET /api/progress/project/:projectId - Government reads live contractor reports
progressRouter.get(
  '/project/:projectId',
  requireAuth,
  requireGovernment,
  (req, res, next) => progressController.listProject(req, res, next)
);

// POST /api/progress/submit - Contractor submits progress update
progressRouter.post(
  '/submit',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireContractor,
  (req, res, next) => progressController.submit(req, res, next)
);

// POST /api/progress/review - Government verifies progress update
progressRouter.post(
  '/review',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => progressController.review(req, res, next)
);
