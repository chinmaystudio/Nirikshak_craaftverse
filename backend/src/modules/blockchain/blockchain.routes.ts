import { Router } from 'express';
import { blockchainController } from './blockchain.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const blockchainRouter = Router();

// GET /api/integrity/project/:projectId - Get project blockchain audit trail
blockchainRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => blockchainController.getProjectIntegrityTrail(req, res).catch(next)
);

// GET /api/integrity/entity/:entityType/:entityId - Get entity blockchain history
blockchainRouter.get(
  '/entity/:entityType/:entityId',
  requireAuth,
  (req, res, next) => blockchainController.getEntityHistory(req, res).catch(next)
);

// POST /api/integrity/verify - Verify current database state against Hyperledger Fabric anchor
blockchainRouter.post(
  '/verify',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  requireAuth,
  (req, res, next) => blockchainController.verifyEntity(req, res).catch(next)
);

// GET /api/integrity/anchor/:auditId - Get anchor proof details
blockchainRouter.get(
  '/anchor/:auditId',
  requireAuth,
  (req, res, next) => blockchainController.getAnchor(req, res).catch(next)
);
