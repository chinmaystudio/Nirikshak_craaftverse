import { useI18n } from '@/context/I18nContext'
import { useAccessibility } from '@/context/AccessibilityContext'
import { useTheme } from '@/context/ThemeContext'
import type { TextSize } from '@/context/AccessibilityContext'
import { LOCALES } from '@/locales/config'
import type { Locale } from '@/locales/config'
import { cn } from '@/utils/cn'
import { nkFocus } from '@/utils/focus'

/**
 * AccessibilityMenu — the spec's mandatory accessibility menu: Text Size,
 * High Contrast, Theme, Screen-reader structure helper, Reduced Motion.
 * Rendered inside a Dropdown from the header.
 */
export function AccessibilityMenuContent({ close }: { close?: () => void }) {
  const { t, locale, setLocale } = useI18n()
  const { textSize, setTextSize, contrast, setContrast, toggleHighContrast, reducedMotion, setReducedMotion } =
    useAccessibility()
  const { theme, setTheme } = useTheme()

  const sizes: { id: TextSize; label: string; sample: string }[] = [
    { id: 'standard', label: t('a11y.sizeStandard'), sample: 'A' },
    { id: 'large', label: t('a11y.sizeLarge'), sample: 'A' },
    { id: 'xlarge', label: t('a11y.sizeXLarge'), sample: 'A' },
  ]

  return (
    <div className="flex w-64 flex-col gap-3 p-3" role="group" aria-label={t('a11y.menuTitle')}>
      {/* Text size */}
      <div className="flex flex-col gap-1.5">
        <span className="nk-label">{t('a11y.textSize')}</span>
        <div className="flex gap-1" role="group">
          {sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTextSize(s.id)}
              aria-pressed={textSize === s.id}
              className={cn(
                'flex min-h-9 flex-1 items-center justify-center gap-1 rounded-control border text-body-small transition-colors duration-fast',
                textSize === s.id
                  ? 'border-primary bg-primary-soft text-primary-strong'
                  : 'border-border-strong bg-surface text-fg hover:bg-surface-2',
                nkFocus,
              )}
            >
              <span className={cn(s.id === 'large' && 'text-base', s.id === 'xlarge' && 'text-lg')}>{s.sample}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* High contrast */}
      <label className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body-small text-fg">
          <span className="material-symbols-outlined text-[18px] text-fg-muted" aria-hidden="true">
            contrast
          </span>
          {t('a11y.highContrast')}
        </span>
        <input
          type="checkbox"
          checked={contrast === 'high'}
          onChange={() => toggleHighContrast()}
          className="h-4 w-4 accent-primary"
        />
      </label>

      {/* Theme */}
      <div className="flex flex-col gap-1.5">
        <span className="nk-label">{t('a11y.theme')}</span>
        <div className="flex gap-1" role="group">
          {(
            [
              { id: 'light', icon: 'light_mode', label: t('a11y.themeLight') },
              { id: 'dark', icon: 'dark_mode', label: t('a11y.themeDark') },
              { id: 'system', icon: 'routine', label: t('a11y.themeSystem') },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              aria-pressed={theme === opt.id}
              className={cn(
                'flex min-h-9 flex-1 flex-col items-center justify-center gap-0.5 rounded-control border px-1 text-[11px] transition-colors duration-fast',
                theme === opt.id
                  ? 'border-primary bg-primary-soft text-primary-strong'
                  : 'border-border-strong bg-surface text-fg-muted hover:bg-surface-2',
                nkFocus,
              )}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reduced motion */}
      <label className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body-small text-fg">
          <span className="material-symbols-outlined text-[18px] text-fg-muted" aria-hidden="true">
            animation
          </span>
          {t('a11y.reducedMotion')}
        </span>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      </label>

      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <label className="nk-label" htmlFor="a11y-language">
          {t('a11y.language')}
        </label>
        <select
          id="a11y-language"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="h-9 w-full rounded-control border border-border-strong bg-surface px-2 text-body-small text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeLabel}
            </option>
          ))}
        </select>
      </div>

      {close && (
        <button
          type="button"
          onClick={close}
          className={cn(
            'mt-1 min-h-9 rounded-control bg-surface-2 px-3 text-body-small text-fg hover:bg-surface-3',
            nkFocus,
          )}
        >
          {t('common.close')}
        </button>
      )}
    </div>
  )
}
