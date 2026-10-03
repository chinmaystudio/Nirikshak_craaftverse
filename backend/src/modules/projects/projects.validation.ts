import { z } from 'zod';

export const CreateProjectSchema = z.object({
  nirikshak_project_id: z.string().trim().regex(/^NIR-[A-Z0-9_-]{3,20}$/, 'Invalid NIRIKSHAK Project ID format'),
  project_name: z.string().trim().min(3).max(255),
  description: z.string().trim().max(5000).optional(),
  sector: z.string().trim().min(2).max(100),
  subsector: z.string().trim().max(100).optional(),
  project_authority: z.string().trim().min(2).max(255),
  state: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  location_text: z.string().trim().min(3).max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  total_cost_inr_crore: z.number().positive(),
  planned_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  original_completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_public: z.boolean().default(true),
});

export const ListProjectsQuerySchema = z.object({
  city: z.string().optional(),
  sector: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
