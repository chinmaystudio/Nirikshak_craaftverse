import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { DEPARTMENTS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

/** SelectDepartmentPage — officer picks their department context (demo). */
export function SelectDepartmentPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">{t('auth.selectDepartment')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.selectRole')} follows next.</p>

      <ul className="mt-5 flex flex-col gap-2">
        {DEPARTMENTS.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => setSelected(d.id)}
              aria-pressed={selected === d.id}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-control border p-3 text-left transition-colors duration-fast',
                selected === d.id
                  ? 'border-primary bg-primary-soft'
                  : 'border-border-strong bg-surface hover:bg-surface-2',
              )}
            >
              <span className="flex flex-col">
                <span className="text-label text-fg">{d.name}</span>
                <span className="text-caption text-fg-subtle">{d.nameHi}</span>
              </span>
              <span className="nk-mono-id text-fg-muted">{d.code}</span>
            </button>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        block
        className="mt-5"
        icon="arrow_forward"
        disabled={!selected}
        onClick={() => navigate('/select-role')}
      >
        {t('auth.continue')}
      </Button>
    </Card>
  )
}
