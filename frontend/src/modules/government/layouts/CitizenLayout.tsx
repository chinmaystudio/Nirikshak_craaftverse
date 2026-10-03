import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppFooter } from '@/components/layout/AppFooter'
import { useI18n } from '@/context/I18nContext'
import { Logo } from '@/components/ui/Logo'
import { Link, NavLink } from 'react-router-dom'

/**
 * CitizenLayout — public chrome: slim top bar with logo + citizen nav,
 * no login required. Distinct from the officer shell on purpose.
 */
export function CitizenLayout() {
  const { t } = useI18n()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  const navItems = [
    { to: '/citizen', labelKey: 'nav.dashboard', end: true },
    { to: '/citizen/projects', labelKey: 'nav.projects' },
    { to: '/citizen/nearby', labelKey: 'citizen.nearby' },
    { to: '/citizen/grievance', labelKey: 'citizen.fileGrievance' },
    { to: '/citizen/track', labelKey: 'citizen.trackGrievance' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a href="#main-content" className="skip-link">
        {t('common.skipToContent')}
      </a>

      <header className="sticky top-0 z-header border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-4">
          <Logo variant="full" to="/citizen" className="h-8" alt={t('common.appName')} />
          <span className="hidden rounded-badge border border-primary-border bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-strong md:inline">
            {t('citizen.portalTitle')}
          </span>
          <nav aria-label="Citizen portal" className="ml-auto flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-control px-3 py-2 text-body-small transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive ? 'bg-primary-soft font-semibold text-primary-strong' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                  }`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="ml-2 whitespace-nowrap rounded-control border border-primary-border bg-primary-soft px-3 py-2 text-body-small font-semibold text-primary-strong hover:bg-primary hover:text-primary-on focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Officer Login
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      <AppFooter />
    </div>
  )
}
