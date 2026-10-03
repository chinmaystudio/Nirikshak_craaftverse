import { z } from 'zod';

export const SubmitPaymentClaimSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  claimed_amount: z.number().positive('Claimed amount must be greater than zero'),
  milestone_id: z.string().uuid().optional(),
  claim_type: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
});

export const ReviewPaymentClaimSchema = z.object({
  claim_id: z.string().uuid('Invalid claim ID'),
  decision: z.enum(['APPROVED', 'REJECTED']),
  approved_amount: z.number().nonnegative().optional(),
  verified_amount: z.number().nonnegative().optional(),
  review_notes: z.string().max(2000).optional(),
});

export const RecordPaymentSchema = z.object({
  claim_id: z.string().uuid('Invalid claim ID'),
  amount_paid: z.number().positive('Amount paid must be greater than zero'),
  payment_reference: z.string().min(1).max(100),
  payment_method: z.string().max(50).optional(),
});

export const FinancialUpdateSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  observation_date: z.string(),
  planned_expenditure_inr_crore: z.number().nonnegative(),
  actual_expenditure_inr_crore: z.number().nonnegative(),
  cost_variance_percent: z.number().optional(),
  notes: z.string().max(2000).optional(),
});

export type SubmitPaymentClaimInput = z.infer<typeof SubmitPaymentClaimSchema>;
export type ReviewPaymentClaimInput = z.infer<typeof ReviewPaymentClaimSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type FinancialUpdateInput = z.infer<typeof FinancialUpdateSchema>;
