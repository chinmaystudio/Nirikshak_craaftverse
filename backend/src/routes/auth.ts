import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../services/supabase.js';
import { rateLimit } from '../middleware/security.js';

export const authRouter = Router();

const RegisterSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('citizen'),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    fullName: z.string().trim().min(3).max(120),
    phone: z.string().trim().regex(/^\d{10}$/).optional(),
    city: z.string().trim().max(80).optional(),
    ward: z.string().trim().max(120).optional(),
    preferredLanguage: z.string().trim().max(10).optional(),
  }),
  z.object({
    accountType: z.literal('government'),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    fullName: z.string().trim().min(3).max(120),
    employeeId: z.string().trim().min(2).max(80),
    department: z.string().trim().min(2).max(160),
    designation: z.string().trim().min(2).max(120),
    state: z.string().trim().min(2).max(80),
    district: z.string().trim().min(2).max(80),
  }),
  z.object({
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
  }),
]);

authRouter.post(
  '/register',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: 'Too many registration attempts. Please wait 15 minutes and try again.' }),
  async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REGISTRATION', message: parsed.error.issues[0]?.message || 'Please check your registration details.' },
      });
    }

    const input = parsed.data;
    const metadata: Record<string, string> = {
      full_name: input.fullName,
      account_type: input.accountType,
    };

    if (input.accountType === 'citizen') {
      Object.assign(metadata, {
        role: 'citizen',
        phone: input.phone || '',
        city: input.city || '',
        ward: input.ward || '',
        preferredLanguage: input.preferredLanguage || 'en',
      });
    } else if (input.accountType === 'government') {
      Object.assign(metadata, {
        requested_role: 'government_engineer',
        employee_id: input.employeeId,
        department: input.department,
        designation: input.designation,
        state: input.state,
        district: input.district,
      });
    } else {
      Object.assign(metadata, {
        requested_role: 'contractor_admin',
        phone: input.phone,
        company_name: input.companyName,
        registration_cin: input.registrationCin,
        gstin: input.gstin,
        contractor_class: input.contractorClass,
        state: input.state,
        district: input.district,
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email.toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error || !data.user) {
      console.error('Supabase account creation failed', {
        code: error?.code,
        status: error?.status,
        message: error?.message,
      });
      const duplicate = error?.message?.toLowerCase().includes('already') || error?.status === 422;
      return res.status(duplicate ? 409 : 400).json({
        success: false,
        error: {
          code: duplicate ? 'ACCOUNT_EXISTS' : 'REGISTRATION_FAILED',
          message: duplicate
            ? 'An account with this email already exists. Please sign in instead.'
            : 'We could not create the account. Please check the details and try again.',
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        userId: data.user.id,
        accountType: input.accountType,
        requiresApproval: input.accountType !== 'citizen',
      },
    });
  }
);
