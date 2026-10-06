import { z } from 'zod';

export const CreateTenderSchema = z.object({
  project_id: z.string().trim().min(1, 'Project ID required'),
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().max(5000).optional(),
  estimated_value_inr_crore: z.number().positive(),
  mode: z.enum(['e-Tender', 'Manual', 'Limited']).default('e-Tender').optional(),
});

export const SubmitBidSchema = z.object({
  tender_id: z.string().uuid(),
  bid_amount: z.number().positive(),
  technical_proposal_url: z.string().url().optional(),
  validity_days: z.number().int().min(30).max(365).default(120),
});

export const SaveTenderBidSchema = z.object({
  tender_id: z.string().uuid(),
  bid_amount: z.number().positive(),
  technical_proposal: z.string().trim().min(1).max(20000),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
});

export const AwardContractSchema = z.object({
  tender_id: z.string().uuid(),
  selected_bid_id: z.string().uuid(),
  contract_number: z.string().trim().min(3).max(100),
  awarded_value: z.number().positive(),
  scheduled_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_completion_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateTenderInput = z.infer<typeof CreateTenderSchema>;
export type SubmitBidInput = z.infer<typeof SubmitBidSchema>;
export type AwardContractInput = z.infer<typeof AwardContractSchema>;
