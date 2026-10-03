import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/** TwoFactorPage — authenticator-app step (demo). */
export function TwoFactorPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">{t('auth.2faTitle')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.2faSubtitle')}</p>

      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/government/dashboard')
        }}
      >
        <div className="flex flex-col gap-1">
          <label className="nk-label" htmlFor="tfa-code">
            {t('auth.2faTitle')}
          </label>
          <input
            id="tfa-code"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-12 rounded-control border border-border-strong bg-surface text-center text-heading-2 tabular-nums tracking-[0.3em] text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
        <Button type="submit" size="lg" block icon="verified_user" disabled={code.length !== 6}>
          {t('auth.continue')}
        </Button>
      </form>

      <p className="mt-4 rounded-control bg-surface-2 p-3 text-caption text-fg-muted">
        {t('auth.securityNote')}
      </p>
    </Card>
  )
}
