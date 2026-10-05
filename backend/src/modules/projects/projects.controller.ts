import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service.js';
import { CreateProjectSchema, ListProjectsQuerySchema } from './projects.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class ProjectsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ListProjectsQuerySchema.parse(req.query);
      const result = await projectsService.listPublic(query);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.header('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : (req as any).token;
      const result = await projectsService.getProject(req.params.id, token);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateProjectSchema.parse(req.body);
      const result = await projectsService.createProject(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
