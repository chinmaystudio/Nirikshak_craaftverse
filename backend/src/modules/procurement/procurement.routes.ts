import { Router } from 'express';
import { procurementController } from './procurement.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';

export const procurementRouter = Router();

// POST /api/tenders - Publish a tender for a project owned by caller's Government organization
procurementRouter.post('/', requireAuth, requireGovernment, (req, res, next) =>
  procurementController.publishTender(req, res, next)
);
