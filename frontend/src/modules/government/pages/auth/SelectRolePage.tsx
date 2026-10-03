import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { authApi } from '@/api'
import { cn } from '@/utils/cn'

const ROLES = [
  { id: 'admin', label: 'Administrator', desc: 'Full platform configuration and role management.' },
  { id: 'chief-engineer', label: 'Chief Engineer / PD', desc: 'Department-wide approvals, fund release, oversight.' },
  { id: 'se', label: 'Superintending Engineer', desc: 'Circle-level technical sanction and review.' },
  { id: 'ee', label: 'Executive Engineer', desc: 'Division-level execution, bills and MB entries.' },
  { id: 'auditor', label: 'Auditor (read-only)', desc: 'Audit observations and evidence, no actions.' },
] as const

/** SelectRolePage — final demo auth step; signs the officer in. */
export function SelectRolePage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleContinue() {
    if (!role) return
    setBusy(true)
    const officer = await authApi.signIn('demo', 'demo')
    login({ ...officer, roles: [...officer.roles, `role:${role}`] })
    navigate('/government/dashboard')
  }

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">{t('auth.selectRole')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.mockLoginNote')}</p>

      <ul className="mt-5 flex flex-col gap-2">
        {ROLES.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setRole(r.id)}
              aria-pressed={role === r.id}
              className={cn(
                'flex w-full flex-col gap-0.5 rounded-control border p-3 text-left transition-colors duration-fast',
                role === r.id ? 'border-primary bg-primary-soft' : 'border-border-strong bg-surface hover:bg-surface-2',
              )}
            >
              <span className="text-label text-fg">{r.label}</span>
              <span className="text-caption text-fg-subtle">{r.desc}</span>
            </button>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        block
        className="mt-5"
        icon="login"
        disabled={!role || busy}
        onClick={handleContinue}
      >
        {busy ? t('common.loading') : `${t('auth.signIn')} →`}
      </Button>
    </Card>
  )
}
