export type Locale = 'en' | 'hi' | 'mr'

export const LOCALE_STORAGE_KEY = 'nirikshak.locale'

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
]

export const DEFAULT_LOCALE: Locale =
  (import.meta.env.VITE_DEFAULT_LOCALE as Locale | undefined) ?? 'en'

/**
 * English is the complete base dictionary and ships with the initial bundle;
 * hi/mr are code-split and fetched on first use, falling back to English per
 * key until loaded.
 */
import { en } from './en'

export const BASE_DICTIONARY: Record<string, string> = en

const DICTIONARY_LOADERS: Record<Locale, () => Promise<Record<string, string>>> = {
  en: () => Promise.resolve(en),
  hi: () => import('./hi').then((m) => m.hi),
  mr: () => import('./mr').then((m) => m.mr),
}

/** Fetch a locale dictionary on demand (resolved immediately for English). */
export function loadDictionary(locale: Locale): Promise<Record<string, string>> {
  return DICTIONARY_LOADERS[locale]()
}
