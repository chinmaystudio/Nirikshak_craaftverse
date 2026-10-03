import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Card } from '@/components/ui/Card'
import { TextField, TextArea, Select } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { citizenApi } from '@/api'
import { useToast } from '@/context/ToastContext'
import { PROJECTS } from '@/data/projects'

/**
 * CitizenGrievancePage — public grievance form (no login). Collects the
 * minimum necessary information; the reference number is shown for tracking.
 */
export function CitizenGrievancePage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [projectRef, setProjectRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const g = await citizenApi.submitGrievanceInput({
        subject,
        description,
        projectId: projectRef || undefined,
      })
      setReference(g.id)
      showToast(t('citizen.grievanceSubmitted', { id: g.id }), 'success')
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="material-symbols-outlined text-[44px] text-success-strong" aria-hidden="true">
            mark_email_read
          </span>
          <h1 className="text-heading-2 text-fg">Grievance submitted</h1>
          <p className="text-body text-fg-muted">{t('citizen.grievanceSubmitted', { id: reference })}</p>
          <p className="nk-mono-id text-heading-3 text-primary-strong">{reference}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link to={`/citizen/track?ref=${encodeURIComponent(reference)}`}>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-primary-border bg-primary px-4 text-button text-primary-on transition-colors duration-fast hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">travel_explore</span>
                {t('citizen.trackGrievance')}
              </span>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setReference(null)
                setSubject('')
                setDescription('')
                setProjectRef('')
              }}
            >
              File another
            </Button>
          </div>
        </Card>
        <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('citizen.grievanceTitle')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">{t('citizen.grievanceIntro')}</p>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <TextField
            label={t('citizen.grievanceSubject')}
            required
            block
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Road surface damaged near the culvert"
          />
          <TextArea
            label={t('citizen.grievanceDescription')}
            required
            block
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helper="Include the location and what you observed. Avoid sharing ID numbers or bank details."
          />
          <Select
            label={t('citizen.grievanceRelatedProject')}
            value={projectRef}
            onChange={(e) => setProjectRef(e.target.value)}
            placeholder="No specific project"
            options={PROJECTS.map((p) => ({ value: p.id, label: `${p.id} — ${p.name}` }))}
          />
          <TextField label={t('citizen.grievanceNameOptional')} block readOnly placeholder="Optional in this demo" />
          <TextField label={t('citizen.grievanceContact')} block type="text" placeholder="Optional in this demo" />
          <Button type="submit" variant="primary" icon="outbox" disabled={submitting || !subject.trim() || !description.trim()}>
            {submitting ? 'Submitting…' : t('citizen.grievanceSubmit')}
          </Button>
        </form>
      </Card>

      <p className="rounded-control bg-surface-2 p-3 text-caption text-fg-muted">{t('citizen.privacyNote')}</p>
    </div>
  )
}
