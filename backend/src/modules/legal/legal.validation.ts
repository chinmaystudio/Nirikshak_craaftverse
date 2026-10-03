import { z } from 'zod';

export const CreateLitigationSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  case_number: z.string().min(1).max(100),
  court_forum: z.string().min(1).max(255),
  case_type: z.string().min(1).max(100),
  filing_date: z.string(),
  dispute_amount_inr: z.number().nonnegative().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  internal_notes: z.string().max(5000).optional(),
});

export const AddLitigationEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  event_date: z.string(),
  summary: z.string().min(1).max(5000),
  next_date: z.string().optional(),
});

export const ProposeSettlementSchema = z.object({
  litigation_id: z.string().uuid('Invalid litigation ID'),
  project_id: z.string().uuid('Invalid project ID'),
  settlement_amount_inr: z.number().nonnegative(),
  terms: z.string().min(1).max(5000),
});

export const ReviewSettlementSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  review_notes: z.string().max(5000).optional(),
});

export type CreateLitigationInput = z.infer<typeof CreateLitigationSchema>;
export type AddLitigationEventInput = z.infer<typeof AddLitigationEventSchema>;
export type ProposeSettlementInput = z.infer<typeof ProposeSettlementSchema>;
export type ReviewSettlementInput = z.infer<typeof ReviewSettlementSchema>;
