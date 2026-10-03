import { z } from 'zod';

export const AiFeedbackSchema = z.object({
  analysis_id: z.string().min(1, 'analysis_id is required'),
  government_feedback: z.enum(['accepted', 'useful', 'neutral', 'rejected', 'harmful']),
  note: z.string().optional(),
});

export type AiFeedbackInput = z.infer<typeof AiFeedbackSchema>;
