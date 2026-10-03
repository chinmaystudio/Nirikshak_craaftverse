import { z } from 'zod';

export const CreateUploadUrlSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  file_name: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(100),
  document_type: z.string().min(1).max(100),
});

export const RegisterDocumentSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  document_type: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  file_name: z.string().min(1).max(255),
  file_size: z.number().nonnegative().optional(),
  mime_type: z.string().max(100).optional(),
  storage_path: z.string().min(1).max(500),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED']).default('INTERNAL'),
});

export type CreateUploadUrlInput = z.infer<typeof CreateUploadUrlSchema>;
export type RegisterDocumentInput = z.infer<typeof RegisterDocumentSchema>;
