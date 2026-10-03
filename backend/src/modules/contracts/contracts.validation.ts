import { z } from 'zod';

export const AwardContractSchema = z.object({
  tender_id: z.string().uuid('Invalid tender ID'),
  bid_id: z.string().uuid('Invalid bid ID'),
  award_notes: z.string().max(2000).optional(),
});

export type AwardContractInput = z.infer<typeof AwardContractSchema>;
