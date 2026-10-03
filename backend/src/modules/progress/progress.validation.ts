import { z } from 'zod';

export const SubmitProgressSchema = z.object({
  project_id: z.string().uuid(),
  milestone_id: z.string().uuid().optional().nullable(),
  reported_progress: z.number().min(0).max(100),
  description: z.string().trim().min(5).max(3000),
  evidence: z
    .array(
      z.object({
        evidence_type: z.enum(['GEO_TAGGED_IMAGE', 'DRONE_SURVEY', 'MATERIAL_TEST_REPORT', 'LAB_INSPECTION']),
        storage_path: z.string().min(5).max(500),
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
});

export const ReviewProgressSchema = z.object({
  progress_update_id: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED']),
  verified_progress: z.number().min(0).max(100).optional().nullable(),
  review_notes: z.string().trim().min(3).max(3000),
});

export type SubmitProgressInput = z.infer<typeof SubmitProgressSchema>;
export type ReviewProgressInput = z.infer<typeof ReviewProgressSchema>;
