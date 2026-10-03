import { Router } from 'express';
import { contractsController } from './contracts.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const contractsRouter = Router();

// POST /api/contracts/award - Award contract via secure RPC (Government only)
contractsRouter.post(
  '/award',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => contractsController.award(req, res, next)
);

// GET /api/contracts/:id - Get contract detail
contractsRouter.get(
  '/:id',
  requireAuth,
  (req, res, next) => contractsController.getById(req, res, next)
);

// GET /api/contracts/project/:projectId - List project contracts
contractsRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => contractsController.listByProject(req, res, next)
);
