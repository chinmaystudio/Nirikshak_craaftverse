import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Logo } from '@/components/ui/Logo'
import { useTheme } from '@/context/ThemeContext'

/**
 * AuthLayout — centered card over an institutional panel; logo lockup, demo
 * disclaimer, language selector. No marketing hero, no glassmorphism.
 */
export function AuthLayout() {
  const { t } = useI18n()
  const { resolved } = useTheme()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center p-4"
        style={
          resolved === 'dark'
            ? { backgroundImage: 'none' }
            : undefined
        }
        tabIndex={-1}
      >
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo variant="full" to={undefined} className="h-12" alt={t('common.appName')} />
            <p className="text-caption uppercase tracking-[0.12em] text-fg-subtle">{t('common.tagline')}</p>
          </div>
          <Outlet />
          <p className="mt-6 text-center text-caption text-fg-subtle">{t('auth.securityNote')}</p>
        </div>
      </main>
    </div>
  )
}
