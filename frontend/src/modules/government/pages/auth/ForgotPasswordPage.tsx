import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/api/apiClient'

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await apiClient.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Could not send recovery email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">{t('auth.resetTitle')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.securityNote')}</p>

      {sent ? (
        <div className="mt-5 rounded-control border border-success-border bg-success-tint p-3 text-body-small text-success-strong">
          <span className="material-symbols-outlined mr-1 align-middle text-[18px]" aria-hidden="true">
            mark_email_read
          </span>
          If an account exists for this address, a password recovery email has been sent.
        </div>
      ) : (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField
            label="Official email"
            type="email"
            required
            startIcon="mail"
            placeholder="you@department.gov.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-body-small text-danger-strong">{error}</p>}
          <Button type="submit" size="lg" block icon="outgoing_mail" disabled={busy}>
            Send reset link
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-4 inline-block rounded-[2px] text-body-small text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        {t('common.back')} — {t('auth.signIn')}
      </Link>
    </Card>
  )
}
