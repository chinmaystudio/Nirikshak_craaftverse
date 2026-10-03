import { Router } from 'express';
import { inspectionsController } from './inspections.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const inspectionsRouter = Router();

// POST /api/inspections - Schedule inspection (Government only)
inspectionsRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => inspectionsController.schedule(req, res, next)
);

// PUT /api/inspections/:id/complete - Complete inspection (Government only)
inspectionsRouter.put(
  '/:id/complete',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => inspectionsController.complete(req, res, next)
);

// GET /api/inspections/project/:projectId - List inspections for project
inspectionsRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => inspectionsController.listByProject(req, res, next)
);

// POST /api/inspections/:id/findings - Create finding on inspection (Government only)
inspectionsRouter.post(
  '/:id/findings',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => inspectionsController.createFinding(req, res, next)
);

// PUT /api/inspections/findings/:findingId/resolve - Resolve finding
inspectionsRouter.put(
  '/findings/:findingId/resolve',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => inspectionsController.resolveFinding(req, res, next)
);

// GET /api/inspections/project/:projectId/findings - List findings for project
inspectionsRouter.get(
  '/project/:projectId/findings',
  requireAuth,
  (req, res, next) => inspectionsController.listProjectFindings(req, res, next)
);
