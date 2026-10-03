import { Response, NextFunction } from 'express';
import { documentsService } from './documents.service.js';
import { CreateUploadUrlSchema, RegisterDocumentSchema } from './documents.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class DocumentsController {
  async requestUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateUploadUrlSchema.parse(req.body);
      const result = await documentsService.requestUploadUrl(validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterDocumentSchema.parse(req.body);
      const result = await documentsService.registerDocument(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await documentsService.getDownloadUrl(id, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await documentsService.listProjectDocuments(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
