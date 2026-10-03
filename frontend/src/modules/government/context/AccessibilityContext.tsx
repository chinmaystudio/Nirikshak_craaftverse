import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Accessibility preferences — text size, high contrast, reduced motion —
 * persisted and applied as root classes (mirrored by the inline pre-paint
 * script in index.html so there is no flash).
 */

export type TextSize = 'standard' | 'large' | 'xlarge'
export type ContrastMode = 'standard' | 'high'

const CONTRAST_KEY = 'nirikshak.contrast'
const TEXT_SIZE_KEY = 'nirikshak.textSize'
const REDUCED_MOTION_KEY = 'nirikshak.reducedMotion'

interface AccessibilityContextValue {
  textSize: TextSize
  setTextSize: (s: TextSize) => void
  contrast: ContrastMode
  setContrast: (c: ContrastMode) => void
  /** Convenience toggle used by the header a11y button. */
  toggleHighContrast: () => void
  reducedMotion: boolean
  setReducedMotion: (r: boolean) => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

function readKey<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (v && (allowed as string[]).includes(v)) return v as T
  } catch {
    /* ignore */
  }
  return fallback
}

function writeKey(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    readKey(TEXT_SIZE_KEY, ['standard', 'large', 'xlarge'], 'standard'),
  )
  const [contrast, setContrastState] = useState<ContrastMode>(() =>
    readKey(CONTRAST_KEY, ['standard', 'high'], 'standard'),
  )
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REDUCED_MOTION_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('text-lg-size', textSize === 'large')
    root.classList.toggle('text-xl-size', textSize === 'xlarge')
    writeKey(TEXT_SIZE_KEY, textSize)
  }, [textSize])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', contrast === 'high')
    writeKey(CONTRAST_KEY, contrast)
  }, [contrast])

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion)
    writeKey(REDUCED_MOTION_KEY, String(reducedMotion))
  }, [reducedMotion])

  const setTextSize = useCallback((s: TextSize) => setTextSizeState(s), [])
  const setContrast = useCallback((c: ContrastMode) => setContrastState(c), [])
  const toggleHighContrast = useCallback(
    () => setContrastState((c) => (c === 'high' ? 'standard' : 'high')),
    [],
  )
  const setReducedMotion = useCallback((r: boolean) => setReducedMotionState(r), [])

  const value = useMemo(
    () => ({ textSize, setTextSize, contrast, setContrast, toggleHighContrast, reducedMotion, setReducedMotion }),
    [textSize, setTextSize, contrast, setContrast, toggleHighContrast, reducedMotion, setReducedMotion],
  )
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}
