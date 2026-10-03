import { z } from 'zod';

export const MarkNotificationReadSchema = z.object({
  notification_id: z.string().uuid('Invalid notification ID'),
});

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;
