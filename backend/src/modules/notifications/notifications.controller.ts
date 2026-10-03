import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { MarkNotificationReadSchema } from './notifications.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class NotificationsController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const list = await notificationsService.listNotifications(req.userContext!, req.token!, limit);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  async unreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationsService.getUnreadCount(req.userContext!, req.token!);
      ApiResponseHelper.success(res, { unread_count: count });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await notificationsService.markRead(id, req.userContext!, req.token!);
      ApiResponseHelper.success(res, { success: result });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationsService.markAllRead(req.userContext!, req.token!);
      ApiResponseHelper.success(res, { success: result });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
