import { z } from 'zod';

export const CreateMilestoneSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  milestone_code: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  sequence_number: z.number().int().min(1),
  weight_percentage: z.number().min(0.01).max(100),
  planned_start_date: z.string().optional(),
  planned_completion_date: z.string(),
  payment_percentage: z.number().min(0).max(100).optional(),
});

export const UpdateMilestoneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  weight_percentage: z.number().min(0.01).max(100).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']).optional(),
  actual_completion_date: z.string().optional(),
  payment_percentage: z.number().min(0).max(100).optional(),
});

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
