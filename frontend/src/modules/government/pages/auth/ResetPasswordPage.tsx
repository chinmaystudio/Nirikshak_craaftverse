import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { apiClient } from '@/lib/api/apiClient'
import { clearRecoveryProof, getRecoveryProof } from '@/lib/auth/recoveryProof'

export function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const proof = getRecoveryProof()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proof) {
      setError('This recovery link is invalid or expired. Request a new link.')
      return
    }
    if (pw.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (pw !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await apiClient.post('/api/auth/reset-password', { token: proof, newPassword: pw })
      clearRecoveryProof()
      setPw('')
      setConfirm('')
      setComplete(true)
    } catch (err: any) {
      setError(err?.message || 'Could not update your password. Request a new recovery link.')
    } finally {
      setBusy(false)
    }
  }

  if (complete) {
    return (
      <Card className="p-6">
        <h1 className="text-heading-2 text-fg">Password updated</h1>
        <p className="mt-2 text-body-small text-fg-muted">Your password is ready. Sign in to continue.</p>
        <Button type="button" size="lg" block onClick={() => navigate('/government/login')}>
          Go to government sign in
        </Button>
      </Card>
    )
  }

  if (!proof) {
    return (
      <Card className="p-6">
        <h1 className="text-heading-2 text-fg">Recovery link required</h1>
        <p className="mt-2 text-body-small text-fg-muted">Open the latest password recovery email. The link expires after 60 minutes.</p>
        <Link to="/government/login" className="mt-4 inline-block text-primary-strong">Government sign in</Link>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">{t('auth.resetTitle')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.resetSubtitle')}</p>

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          label={t('auth.newPassword')}
          type="password"
          required
          helper="Minimum 8 characters."
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          error={error ?? undefined}
          autoComplete="new-password"
        />
        <TextField
          label={t('auth.confirmPassword')}
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" block icon="lock_reset" disabled={busy}>
          {t('auth.updatePassword')}
        </Button>
      </form>
    </Card>
  )
}
