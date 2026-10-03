import { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useAccessibility } from '@/context/AccessibilityContext'
import { useTheme } from '@/context/ThemeContext'
import { Dropdown, MenuItem, MenuDivider } from '@/components/navigation/Dropdown'
import { AccessibilityMenuContent } from '@/components/accessibility/AccessibilityMenu'
import { Logo } from '@/components/ui/Logo'
import { TopNav } from '@/components/layout/TopNav'
import { LOCALES } from '@/locales/config'
import type { Locale } from '@/locales/config'
import { cn } from '@/utils/cn'
import { RealtimeStatusIndicator } from '@/core/realtime/RealtimeStatusIndicator'

/**
 * GovernmentHeader — two-row fixed header (Stitch skeleton extended):
 * row 1: logo, global search with "/" hint, A- A A+ steppers, high-contrast
 * toggle, a11y menu, language select, dark-mode toggle, notifications, profile.
 * row 2: TopNav — the global module navigation bar (config-driven).
 */
export function GovernmentHeader({
  officerName,
  officerRole,
  onLogout,
  onOpenNotifications,
  onSearch,
  showProjectNavToggle,
  onOpenProjectNav,
}: {
  officerName?: string
  officerRole?: string
  onLogout: () => void
  onOpenNotifications: () => void
  onSearch?: (q: string) => void
  /** Contextual project/approval sidebar available (mobile toggle in nav row). */
  showProjectNavToggle?: boolean
  onOpenProjectNav?: () => void
}) {
  const { t, locale, setLocale } = useI18n()
  const { textSize, setTextSize, toggleHighContrast, contrast } = useAccessibility()
  const { resolved, toggle } = useTheme()
  const searchId = useId()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface shadow-card">
      <div className="flex h-header items-center gap-3 px-3 md:px-4">
      <Logo variant="full" to="/government/dashboard" className="hidden h-8 sm:block" alt={t('common.appName')} />
      <Logo variant="icon" to="/government/dashboard" className="h-8 sm:hidden" alt={t('common.appName')} />

      {/* Global search */}
      <div className="relative ml-2 hidden min-w-0 flex-1 md:block">
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-fg-subtle"
          aria-hidden="true"
        >
          search
        </span>
        <input
          id={searchId}
          type="search"
          placeholder={t('common.searchPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) onSearch((e.target as HTMLInputElement).value)
          }}
          className="h-10 w-full max-w-md rounded-control border border-border bg-canvas pl-9 pr-14 text-body text-fg placeholder:text-fg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={t('common.search')}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-badge border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-subtle lg:block">
          /
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1 md:gap-1.5">
        <RealtimeStatusIndicator className="hidden text-fg-muted sm:inline-flex" />
        {/* Text size steppers */}
        <div className="hidden items-center rounded-control border border-border lg:flex" role="group" aria-label={t('a11y.textSize')}>
          {(
            [
              { id: 'standard', icon: 'text_decrease', label: 'Decrease text size', v: 'standard' as const },
              { id: 'large', icon: 'text_increase', label: 'Increase text size', v: 'large' as const },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setTextSize(b.v)}
              aria-label={b.label}
              title={b.label}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                textSize === b.v && 'bg-surface-2 text-fg',
              )}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {b.icon}
              </span>
            </button>
          ))}
        </div>

        {/* High contrast */}
        <button
          type="button"
          onClick={toggleHighContrast}
          aria-pressed={contrast === 'high'}
          title={t('a11y.highContrast')}
          aria-label={t('a11y.highContrast')}
          className={cn(
            'hidden h-10 w-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:inline-flex',
            contrast === 'high' && 'bg-surface-2 text-fg',
          )}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            contrast
          </span>
        </button>

        {/* A11y menu */}
        <Dropdown
          menuLabel={t('a11y.menuTitle')}
          width="w-auto"
          trigger={({ toggle: tg, id }) => (
            <button
              type="button"
              onClick={tg}
              aria-haspopup="menu"
              aria-labelledby={id}
              aria-label={t('a11y.openMenu')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                accessibility_new
              </span>
            </button>
          )}
        >
          {(close) => <AccessibilityMenuContent close={close} />}
        </Dropdown>

        {/* Language */}
        <div className="hidden lg:block">
          <label className="sr-only" htmlFor="header-language">
            {t('a11y.language')}
          </label>
          <select
            id="header-language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="h-9 rounded-control border border-border bg-canvas px-2 text-body-small text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Dark mode */}
        <button
          type="button"
          onClick={toggle}
          title={resolved === 'dark' ? t('a11y.themeLight') : t('a11y.themeDark')}
          aria-label={resolved === 'dark' ? t('a11y.themeLight') : t('a11y.themeDark')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {resolved === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label={t('nav.alerts')}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            notifications
          </span>
        </button>

        {/* Profile */}
        <Dropdown
          menuLabel="Profile"
          trigger={({ toggle: tg, id }) => (
            <button
              type="button"
              onClick={tg}
              aria-haspopup="menu"
              aria-labelledby={id}
              className="flex min-h-10 items-center gap-2 rounded-control px-2 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span
                className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary-strong md:flex"
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
              </span>
              <span className="hidden min-w-0 flex-col items-start leading-tight xl:flex">
                <span className="max-w-40 truncate text-body-small font-semibold text-fg">{officerName}</span>
                <span className="max-w-40 truncate text-[11px] text-fg-subtle">{officerRole}</span>
              </span>
              <span className="material-symbols-outlined text-[18px] text-fg-subtle" aria-hidden="true">
                expand_more
              </span>
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem icon="settings" onClick={() => { close(); navigate('/government/settings') }}>
                {t('nav.settings')}
              </MenuItem>
              <MenuDivider />
              <MenuItem icon="logout" onClick={() => { close(); onLogout() }}>
                Sign out
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
      </div>

      {/* Row 2 — global module navigation */}
      <TopNav showProjectNavToggle={showProjectNavToggle ?? false} onOpenProjectNav={onOpenProjectNav ?? (() => undefined)} />
    </header>
  )
}
