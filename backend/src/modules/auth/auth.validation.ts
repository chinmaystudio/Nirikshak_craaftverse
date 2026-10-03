import { z } from 'zod';

export const RegisterCitizenSchema = z.object({
  accountType: z.literal('citizen'),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().regex(/^\d{10}$/).optional(),
  city: z.string().trim().max(80).optional(),
  ward: z.string().trim().max(120).optional(),
  preferredLanguage: z.string().trim().max(10).optional(),
});

export const RegisterGovernmentSchema = z.object({
  accountType: z.literal('government'),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(3).max(120),
  employeeId: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(160),
  designation: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
});

export const RegisterContractorSchema = z.object({
  accountType: z.literal('contractor'),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().regex(/^\d{10}$/),
  companyName: z.string().trim().min(2).max(180),
  registrationCin: z.string().trim().min(2).max(40),
  gstin: z.string().trim().min(2).max(30),
  contractorClass: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
});

export const RegisterSchema = z.discriminatedUnion('accountType', [
  RegisterCitizenSchema,
  RegisterGovernmentSchema,
  RegisterContractorSchema,
]);

export type RegisterInput = z.infer<typeof RegisterSchema>;
