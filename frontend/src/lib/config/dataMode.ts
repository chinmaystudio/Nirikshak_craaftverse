export type DataMode = 'LIVE' | 'DEMO';

/**
 * Authoritative data mode controller.
 * In LIVE mode, queries only hit real Supabase & backend services.
 * Silent fallback to mock data on error or empty results is STRICTLY PROHIBITED.
 */
const rawMode = (import.meta.env.VITE_DATA_MODE || '').toUpperCase();
const isLegacyDemo = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true';

export const CURRENT_DATA_MODE: DataMode = rawMode === 'DEMO' || isLegacyDemo ? 'DEMO' : 'LIVE';

export const isLiveMode = (): boolean => CURRENT_DATA_MODE === 'LIVE';
export const isDemoMode = (): boolean => CURRENT_DATA_MODE === 'DEMO';
