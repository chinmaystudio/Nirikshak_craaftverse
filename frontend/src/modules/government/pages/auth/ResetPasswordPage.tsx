import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (pw !== confirm) {
      setError('Passwords do not match.')
      return
    }
    navigate('/login')
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
        <Button type="submit" size="lg" block icon="lock_reset">
          {t('auth.updatePassword')}
        </Button>
      </form>
    </Card>
  )
}
