import { Router } from 'express';
import { resourcesController } from './resources.controller.js';
import { requireAuth, requireGovernment, requireContractor } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const resourcesRouter = Router();

// POST /api/resources/usage - Contractor submits resource usage update
resourcesRouter.post(
  '/usage',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireContractor,
  (req, res, next) => resourcesController.submitUsage(req, res, next)
);

// PUT /api/resources/usage/:id/verify - Government verifies resource usage
resourcesRouter.put(
  '/usage/:id/verify',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => resourcesController.verifyUsage(req, res, next)
);

// GET /api/resources/shortage/:projectId - Latest verified shortage ratio
resourcesRouter.get(
  '/shortage/:projectId',
  requireAuth,
  (req, res, next) => resourcesController.getLatestShortage(req, res, next)
);

// GET /api/resources/project/:projectId - List project resource usage updates
resourcesRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => resourcesController.listProjectUsage(req, res, next)
);
