import { z } from 'zod';

export const CreateComplaintSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  category: z.string().trim().min(2).max(100),
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().min(10).max(5000),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  evidence_paths: z.array(z.string().min(5).max(500)).optional(),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
