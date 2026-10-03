import { Router } from 'express';
import { milestonesController } from './milestones.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const milestonesRouter = Router();

// POST /api/milestones - Create milestone (Government only)
milestonesRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => milestonesController.create(req, res, next)
);

// PUT /api/milestones/:id - Update milestone (Government only)
milestonesRouter.put(
  '/:id',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => milestonesController.update(req, res, next)
);

// GET /api/milestones/project/:projectId - List milestones for project
milestonesRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => milestonesController.listByProject(req, res, next)
);
