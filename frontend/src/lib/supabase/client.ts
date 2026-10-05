import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from '../config/env';

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[NIRIKSHAK] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing.');
}

const isDemo = env.DATA_MODE === 'DEMO';

/**
 * Browser Supabase client.
 * In LIVE mode, authentication is strictly managed by Express BFF via HttpOnly cookies;
 * browser does NOT persist sessions or auto-refresh tokens directly with Supabase.
 */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: isDemo,
    autoRefreshToken: isDemo,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
