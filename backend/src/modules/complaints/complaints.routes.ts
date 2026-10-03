import { Router } from 'express';
import { complaintsController } from './complaints.controller.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const complaintsRouter = Router();

// POST /api/complaints - Submit citizen grievance
complaintsRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  (req, res, next) => complaintsController.submit(req, res, next)
);

// GET /api/complaints/track/:ref - Track complaint status with PII redaction
complaintsRouter.get(
  '/track/:ref',
  (req, res, next) => complaintsController.track(req, res, next)
);
