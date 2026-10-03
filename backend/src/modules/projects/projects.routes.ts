import { Router } from 'express';
import { projectsController } from './projects.controller.js';
import { requireAuth, requireGovernment } from '../../core/auth/auth.middleware.js';

export const projectsRouter = Router();

// GET /api/projects - Public project catalog
projectsRouter.get('/', (req, res, next) => projectsController.list(req, res, next));

// GET /api/projects/:id - Project detail
projectsRouter.get('/:id', (req, res, next) => projectsController.getById(req, res, next));

// POST /api/projects - Create project (Government Admin / Officer only)
projectsRouter.post('/', requireAuth, requireGovernment, (req, res, next) =>
  projectsController.create(req, res, next)
);
