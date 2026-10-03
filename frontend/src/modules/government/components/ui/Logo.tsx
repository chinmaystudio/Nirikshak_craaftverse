import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { useI18n } from '@/context/I18nContext'

/**
 * Logo — uses the provided NIRIKSHAK artwork (public/logo). The dark-canvas
 * variant is swapped via CSS (themes.css .logo-dark-canvas rules) — the
 * artwork itself is never stretched or redrawn; height is constrained and
 * width auto so the aspect ratio is preserved.
 */
export function Logo({
  variant = 'full',
  to = '/',
  className,
  alt,
}: {
  /** full = emblem + wordmark (native), icon = emblem only. */
  variant?: 'full' | 'icon'
  to?: string
  className?: string
  alt?: string
}) {
  const { t } = useI18n()
  const name = alt ?? t('common.appName')
  const content =
    variant === 'full' ? (
      <img
        src="/logo/nirikshak-logo.png"
        alt={name}
        className={cn('logo-dark-canvas logo-light-canvas h-9 w-auto', className)}
        width={1937}
        height={532}
      />
    ) : (
      <img
        src="/logo/nirikshak-icon.png"
        alt={name}
        className={cn('h-9 w-9 object-contain', className)}
        width={512}
        height={512}
      />
    )
  if (!to) return content
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={`${name} — ${APP_TAGLINE}`}
    >
      {content}
    </Link>
  )
}

/** Stacked lockup: icon + two-line wordmark block for sidebars. */
export function LogoLockup({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Logo variant="icon" to={undefined} className="h-8 w-8" alt={t('common.appName')} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-label tracking-[0.08em] text-fg">{t('common.appName')}</span>
        <span className="truncate text-[10px] text-fg-subtle">{t('common.tagline')}</span>
      </span>
    </span>
  )
}
