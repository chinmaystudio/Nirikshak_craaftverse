import { z } from 'zod';

export const SubmitResourceUsageSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  allocation_id: z.string().uuid().optional(),
  reporting_date: z.string(),
  quantity_used: z.number().min(0),
  quantity_available: z.number().min(0),
  shortage_ratio: z.number().min(0).max(1),
  notes: z.string().max(2000).optional(),
});

export const VerifyResourceUsageSchema = z.object({
  verification_status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().max(2000).optional(),
});

export type SubmitResourceUsageInput = z.infer<typeof SubmitResourceUsageSchema>;
export type VerifyResourceUsageInput = z.infer<typeof VerifyResourceUsageSchema>;
