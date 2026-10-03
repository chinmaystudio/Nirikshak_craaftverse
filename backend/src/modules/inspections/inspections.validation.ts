import { z } from 'zod';

export const ScheduleInspectionSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  inspection_type: z.string().min(1).max(100),
  scheduled_date: z.string(),
  summary: z.string().max(2000).optional(),
});

export const CompleteInspectionSchema = z.object({
  inspection_date: z.string(),
  overall_rating: z.string().max(50).optional(),
  summary: z.string().min(1).max(5000),
});

export const CreateFindingSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
});

export const ResolveFindingSchema = z.object({
  resolution_notes: z.string().min(1).max(5000),
});

export type ScheduleInspectionInput = z.infer<typeof ScheduleInspectionSchema>;
export type CompleteInspectionInput = z.infer<typeof CompleteInspectionSchema>;
export type CreateFindingInput = z.infer<typeof CreateFindingSchema>;
export type ResolveFindingInput = z.infer<typeof ResolveFindingSchema>;
