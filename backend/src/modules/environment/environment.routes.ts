import { Router } from 'express';
import { environmentController } from './environment.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const environmentRouter = Router();

// POST /api/environment/clearances - Record clearance (Government only)
environmentRouter.post(
  '/clearances',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => environmentController.createClearance(req, res, next)
);

// GET /api/environment/project/:projectId/clearances - List clearances
environmentRouter.get(
  '/project/:projectId/clearances',
  requireAuth,
  (req, res, next) => environmentController.listClearances(req, res, next)
);

// POST /api/environment/observations - Record observation
environmentRouter.post(
  '/observations',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => environmentController.recordObservation(req, res, next)
);

// POST /api/environment/incidents - Report environmental incident
environmentRouter.post(
  '/incidents',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => environmentController.reportIncident(req, res, next)
);

// GET /api/environment/project/:projectId/incidents - List incidents
environmentRouter.get(
  '/project/:projectId/incidents',
  requireAuth,
  (req, res, next) => environmentController.listIncidents(req, res, next)
);

// GET /api/environment/project/:projectId/summary - Get environment summary
environmentRouter.get(
  '/project/:projectId/summary',
  requireAuth,
  (req, res, next) => environmentController.getSummary(req, res, next)
);
