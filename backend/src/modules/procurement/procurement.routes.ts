import { Router } from 'express';
import { procurementController } from './procurement.controller.js';
import { requireAuth, requireGovernment, requireContractor } from '../../core/auth/auth.middleware.js';

export const procurementRouter = Router();

procurementRouter.get('/', requireAuth, requireGovernment, (req, res, next) =>
  procurementController.listTenders(req, res, next)
);

// POST /api/tenders - Publish a tender for a project owned by caller's Government organization
procurementRouter.post('/', requireAuth, requireGovernment, (req, res, next) =>
  procurementController.publishTender(req, res, next)
);

procurementRouter.post('/:tenderId/bids', requireAuth, requireContractor, (req, res, next) =>
  procurementController.saveTenderBid(req, res, next)
);
