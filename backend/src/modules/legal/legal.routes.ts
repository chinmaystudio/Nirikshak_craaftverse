import { Router } from 'express';
import { legalController } from './legal.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const legalRouter = Router();

// POST /api/legal/litigations - Create litigation record (Government only)
legalRouter.post(
  '/litigations',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => legalController.createLitigation(req, res, next)
);

// GET /api/legal/project/:projectId - List project litigations
legalRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => legalController.listProjectLitigations(req, res, next)
);

// POST /api/legal/litigations/:id/events - Add hearing/event update (Government only)
legalRouter.post(
  '/litigations/:id/events',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => legalController.addEvent(req, res, next)
);

// POST /api/legal/litigations/:id/settlements - Propose settlement
legalRouter.post(
  '/litigations/:id/settlements',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  (req, res, next) => legalController.proposeSettlement(req, res, next)
);

// PUT /api/legal/settlements/:id/review - Review/approve settlement (Government only)
legalRouter.put(
  '/settlements/:id/review',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => legalController.reviewSettlement(req, res, next)
);
