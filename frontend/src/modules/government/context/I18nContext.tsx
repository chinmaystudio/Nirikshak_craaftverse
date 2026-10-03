import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '@/locales/config'
import { DEFAULT_LOCALE, BASE_DICTIONARY, LOCALE_STORAGE_KEY, loadDictionary } from '@/locales/config'

type Dictionaries = Partial<Record<Locale, Record<string, string>>>

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  /** Translate a dot-notation key; falls back to English, then the key itself. */
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (v === 'en' || v === 'hi' || v === 'mr') return v
  } catch {
    /* storage unavailable — fall through */
  }
  return DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)
  const [dictionaries, setDictionaries] = useState<Dictionaries>({ en: BASE_DICTIONARY })
  /** Locales already fetched or currently in flight — dedupes effect runs. */
  const loadingRef = useRef<Set<Locale>>(new Set(['en']))

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (loadingRef.current.has(locale)) return
    loadingRef.current.add(locale)
    let cancelled = false
    loadDictionary(locale)
      .then((dict) => {
        if (!cancelled) setDictionaries((prev) => ({ ...prev, [locale]: dict }))
      })
      .catch(() => {
        // Allow a retry on the next switch back to this locale.
        loadingRef.current.delete(locale)
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l)
    } catch {
      /* non-persistent is acceptable */
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale]
      let value = dict?.[key] ?? BASE_DICTIONARY[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return value
    },
    [locale, dictionaries],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
