import { z } from 'zod';

export const CreateClearanceSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  clearance_type: z.string().min(1).max(100),
  issuing_authority: z.string().min(1).max(255),
  clearance_number: z.string().min(1).max(100),
  issue_date: z.string(),
  valid_until: z.string().optional(),
  status: z.enum(['APPLIED', 'GRANTED', 'REJECTED', 'EXPIRED']),
  conditions_count: z.number().int().nonnegative().optional(),
  conditions_complied_count: z.number().int().nonnegative().optional(),
});

export const RecordObservationSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  observation_date: z.string(),
  parameter_name: z.string().min(1).max(100),
  measured_value: z.number(),
  prescribed_limit: z.number(),
  unit: z.string().min(1).max(50),
  is_compliant: z.boolean(),
  notes: z.string().max(2000).optional(),
});

export const ReportIncidentSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  incident_date: z.string(),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC']),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  mitigation_measures: z.string().max(5000).optional(),
});

export type CreateClearanceInput = z.infer<typeof CreateClearanceSchema>;
export type RecordObservationInput = z.infer<typeof RecordObservationSchema>;
export type ReportIncidentInput = z.infer<typeof ReportIncidentSchema>;
