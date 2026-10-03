import { z } from 'zod';

export const VerifyEntitySchema = z.object({
  body: z.object({
    entityType: z.string().min(1),
    entityId: z.string().min(1),
    auditId: z.string().optional(),
    currentData: z.record(z.any()),
  }),
});

export const ProjectIntegrityParamsSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
});

export const EntityIntegrityParamsSchema = z.object({
  params: z.object({
    entityType: z.string().min(1),
    entityId: z.string().min(1),
  }),
});

export const AnchorParamsSchema = z.object({
  params: z.object({
    auditId: z.string().min(1),
  }),
});
