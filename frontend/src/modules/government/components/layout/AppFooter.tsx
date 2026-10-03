import { useI18n } from '@/context/I18nContext'
import { APP_VERSION } from '@/constants'
import { Logo } from '@/components/ui/Logo'
import { LOCALES } from '@/locales/config'
import { cn } from '@/utils/cn'

/**
 * AppFooter — government footer (Stitch convention): emblem, department line,
 * system status, hosting + version. No social media, no marketing.
 */
export function AppFooter({ className }: { className?: string }) {
  const { t, locale, setLocale } = useI18n()
  return (
    <footer className={cn('border-t border-border bg-surface', className)}>
      <div className="mx-auto flex max-w-content flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <Logo variant="icon" to={undefined} className="h-8 w-8" alt={t('common.appName')} />
          <div className="flex flex-col">
            <span className="text-label tracking-[0.08em] text-fg">{t('common.appName')}</span>
            <span className="text-caption text-fg-subtle">{t('common.tagline')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-caption text-fg-subtle md:items-end">
          <span className="inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-success-strong" aria-hidden="true">
              check_circle
            </span>
            {t('common.footerSystemStatus')}
          </span>
          <span>
            {t('common.footerHosted')} • {t('common.footerVersion')}
          </span>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-2 p-3 text-caption text-fg-subtle">
          <span>NIRIKSHAK Infrastructure Monitoring &amp; Verification Network • Realtime Operational System</span>
          <label className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              translate
            </span>
            <span className="sr-only">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="h-7 rounded-control border border-border-strong bg-surface px-2 text-caption text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Select language"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeLabel}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <span className="sr-only">App version {APP_VERSION}</span>
    </footer>
  )
}
