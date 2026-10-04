export type DataMode = 'LIVE';

/**
 * Authoritative data mode controller.
 * In LIVE mode, queries strictly hit real Supabase & backend services.
 * All demo modes, mock data, and hardcoded fallbacks are strictly prohibited and disabled.
 */
export const CURRENT_DATA_MODE: DataMode = 'LIVE';

export const isLiveMode = (): boolean => true;
export const isDemoMode = (): boolean => false;
