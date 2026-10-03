import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'nirikshak.theme'

interface ThemeContextValue {
  theme: ThemeMode
  /** The mode actually applied after resolving `system`. */
  resolved: 'light' | 'dark'
  setTheme: (t: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function applyClass(mode: ThemeMode) {
  const dark = mode === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    theme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    setResolved(applyClass(theme))
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyClass('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), [])
  const toggle = useCallback(
    () => setThemeState(resolved === 'dark' ? 'light' : 'dark'),
    [resolved],
  )

  const value = useMemo(() => ({ theme, resolved, setTheme, toggle }), [theme, resolved, setTheme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
