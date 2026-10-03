import { Button } from '@/components/ui/Button'
import { useI18n } from '@/context/I18nContext'
import { Logo } from '@/components/ui/Logo'

/** 404 — institutional error page with logo, no humor, no marketing. */
export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <ErrorShell
      code="404"
      title={t('err.notFoundTitle')}
      body={t('err.notFoundBody')}
    />
  )
}

export function ErrorPage({ error }: { error?: Error }) {
  const { t } = useI18n()
  if (error) {
    console.error('Route error:', error)
  }
  return (
    <ErrorShell
      code="500"
      title={t('err.errorTitle')}
      body={t('err.errorBody')}
    />
  )
}

function ErrorShell({ code, title, body }: { code: string; title: string; body: string }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4 text-center">
      <Logo variant="full" to={undefined} className="mb-8 h-10" alt={t('common.appName')} />
      <p className="text-display tabular-nums text-primary-strong">{code}</p>
      <h1 className="mt-2 text-heading-1 text-fg">{title}</h1>
      <p className="mt-2 max-w-md text-body text-fg-muted">{body}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="primary" icon="home" onClick={() => (window.location.href = '/')}>
          {t('err.goHome')}
        </Button>
        <Button variant="outline" icon="arrow_back" onClick={() => window.history.back()}>
          {t('err.goBack')}
        </Button>
      </div>
    </div>
  )
}
