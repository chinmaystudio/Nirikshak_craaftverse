import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const notificationsRouter = Router();

// GET /api/notifications - List notifications
notificationsRouter.get(
  '/',
  requireAuth,
  (req, res, next) => notificationsController.list(req, res, next)
);

// GET /api/notifications/unread-count - Get count of unread notifications
notificationsRouter.get(
  '/unread-count',
  requireAuth,
  (req, res, next) => notificationsController.unreadCount(req, res, next)
);

// POST /api/notifications/:id/read - Mark single notification as read via secure RPC
notificationsRouter.post(
  '/:id/read',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  requireAuth,
  (req, res, next) => notificationsController.markRead(req, res, next)
);

// POST /api/notifications/read-all - Mark all notifications as read
notificationsRouter.post(
  '/read-all',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  requireAuth,
  (req, res, next) => notificationsController.markAllRead(req, res, next)
);
