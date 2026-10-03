/**
 * Centralized, typed browser environment configuration.
 * Avoid reading raw import.meta.env across individual components.
 */
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ylyvhytlvwqebkyawdnq.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, ''),
  DATA_MODE: (import.meta.env.VITE_DATA_MODE || 'LIVE').toUpperCase(),
} as const;
