import { Router } from 'express';
import { financeController } from './finance.controller.js';
import { requireAuth, requireGovernment, requireContractor } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const financeRouter = Router();

// POST /api/finance/claims - Contractor submits payment claim via secure RPC
financeRouter.post(
  '/claims',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  requireContractor,
  (req, res, next) => financeController.submitClaim(req, res, next)
);

// POST /api/finance/claims/review - Government reviews payment claim via secure RPC
financeRouter.post(
  '/claims/review',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => financeController.reviewClaim(req, res, next)
);

// POST /api/finance/payments - Government records payment via secure RPC
financeRouter.post(
  '/payments',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => financeController.recordPayment(req, res, next)
);

// POST /api/finance/updates - Government records official financial progress update
financeRouter.post(
  '/updates',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  requireGovernment,
  (req, res, next) => financeController.recordFinancialUpdate(req, res, next)
);

// GET /api/finance/project/:projectId/summary - Get project finance summary
financeRouter.get(
  '/project/:projectId/summary',
  requireAuth,
  (req, res, next) => financeController.getFinanceSummary(req, res, next)
);

// GET /api/finance/project/:projectId/claims - List project payment claims
financeRouter.get(
  '/project/:projectId/claims',
  requireAuth,
  (req, res, next) => financeController.listClaims(req, res, next)
);

// GET /api/finance/project/:projectId/payments - List project payments
financeRouter.get(
  '/project/:projectId/payments',
  requireAuth,
  (req, res, next) => financeController.listPayments(req, res, next)
);
