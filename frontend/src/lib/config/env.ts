/**
 * Centralized, typed browser environment configuration.
 * Avoid reading raw import.meta.env across individual components.
 * NO hardcoded fallback Supabase URL allowed.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '[CONFIG WARNING] VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be provided via environment variables.'
  );
}

export const env = {
  SUPABASE_URL: supabaseUrl || '',
  SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey || '',
  API_BASE_URL: ((import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || '') as string).replace(/\/$/, ''),
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY || '') as string,
  DATA_MODE: (import.meta.env.VITE_DATA_MODE || 'LIVE').toUpperCase(),
  SHOW_DEMO_CREDENTIALS: import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true',
} as const;
