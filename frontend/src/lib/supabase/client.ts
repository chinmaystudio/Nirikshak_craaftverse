import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from '../config/env';

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[NIRIKSHAK] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing.');
}

/**
 * Single canonical browser Supabase client for all portals (Government, Contractor, Citizen).
 */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
