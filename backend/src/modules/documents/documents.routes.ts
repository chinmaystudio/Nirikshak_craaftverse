import { Router } from 'express';
import { documentsController } from './documents.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const documentsRouter = Router();

// POST /api/documents/upload-url - Generate secure upload path and signed URL
documentsRouter.post(
  '/upload-url',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => documentsController.requestUploadUrl(req, res, next)
);

// POST /api/documents - Register document metadata after upload
documentsRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  requireAuth,
  (req, res, next) => documentsController.register(req, res, next)
);

// GET /api/documents/:id/download-url - Get signed download URL
documentsRouter.get(
  '/:id/download-url',
  requireAuth,
  (req, res, next) => documentsController.getDownloadUrl(req, res, next)
);

// GET /api/documents/project/:projectId - List project documents
documentsRouter.get(
  '/project/:projectId',
  requireAuth,
  (req, res, next) => documentsController.listByProject(req, res, next)
);
