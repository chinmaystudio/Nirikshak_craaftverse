import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { TextField, TextArea, Select, Checkbox } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { DEPARTMENTS, DISTRICTS, PROJECT_CATEGORIES, FUNDING_SOURCES } from '@/constants'
import { formatCr } from '@/utils/format'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/utils/cn'
import { projectsApi } from '@/api'

const STEPS = [
  'Basic Details',
  'Location & Division',
  'Cost & Funding',
  'Approvals & Dates',
  'Milestones',
  'Contractor',
  'Documents',
  'Review & Submit',
] as const

/**
 * PlanningPage — the 8-step "Sanction New Project" wizard (spec). Every step
 * validates inline; review step summarizes; submit creates a demo record.
 */
export function PlanningPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // Active wizard step mirrors the ?step= query param so the sidebar's
  // "Project Creation" outline can deep-link into a specific step.
  const [searchParams, setSearchParams] = useSearchParams()
  const stepParam = Number(searchParams.get('step'))
  const step =
    Number.isInteger(stepParam) && stepParam >= 0 && stepParam < STEPS.length ? stepParam : 0
  const setStep = (s: number) => setSearchParams(s === 0 ? {} : { step: String(s) })
  const [form, setForm] = useState({
    name: '',
    department: '',
    district: '',
    division: '',
    category: '',
    amountCr: '',
    fundingSource: '',
    adminApprovalDate: '',
    technicalApprovalDate: '',
    expectedCompletion: '',
    summary: '',
    confirmChecked: false,
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const amount = Number(form.amountCr) || 0
  const canNext =
    (step === 0 && form.name.trim().length > 3 && form.department && form.category) ||
    (step === 1 && form.district && form.division) ||
    (step === 2 && amount > 0 && form.fundingSource) ||
    (step === 3 && form.adminApprovalDate && form.expectedCompletion) ||
    step === 4 || step === 5 || step === 6 ||
    (step === 7 && form.confirmChecked)

  const submitProject = async () => {
    if (!canNext || submitting) return
    setSubmitting(true)
    try {
      const project = await projectsApi.create({
        name: form.name.trim(),
        department: form.department,
        district: form.district,
        category: form.category,
        amountCr: amount,
        adminApprovalDate: form.adminApprovalDate,
        technicalApprovalDate: form.technicalApprovalDate || undefined,
        expectedCompletion: form.expectedCompletion,
        summary: form.summary.trim() || undefined,
      })
      showToast(`Project ${project.id} created successfully.`, 'success')
      navigate('/government/projects')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Project could not be created.'
      showToast(message, 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('dash.sanctionNewProject')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Project Planning & Creation — complete the sanction details to add the project to the shared register.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex flex-wrap gap-1.5" aria-label="Wizard steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={step === i ? 'step' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-1 text-caption transition-colors duration-fast',
                step === i
                  ? 'border-primary bg-primary text-primary-on'
                  : i < step
                    ? 'border-primary-border bg-primary-soft text-primary-strong'
                    : 'border-border bg-surface text-fg-muted hover:bg-surface-2',
              )}
            >
              <span className="tabular-nums">{i + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <Card className="p-5">
        {step === 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextField label="Project name" required block value={form.name} onChange={set('name')} placeholder="e.g. Widening of MDR-42, Ratnagiri (km 8–14)" />
            </div>
            <Select label={t('common.department')} required value={form.department} onChange={set('department')} placeholder={t('common.select')} options={DEPARTMENTS.map((d) => ({ value: d.name, label: d.name }))} />
            <Select label={t('common.category')} required value={form.category} onChange={set('category')} placeholder={t('common.select')} options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select label={t('common.district')} required value={form.district} onChange={set('district')} placeholder={t('common.select')} options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
            <Select label={t('common.division')} required value={form.division} onChange={set('division')} placeholder={t('common.select')} options={['Konkan', 'Pune', 'Nashik', 'Chhatrapati Sambhajinagar', 'Amravati', 'Nagpur'].map((d) => ({ value: d, label: d }))} />
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="Sanctioned amount (₹ Cr)" required type="number" min={0} step={0.01} value={form.amountCr} onChange={set('amountCr')} helper={amount > 0 ? formatCr(amount) : 'Enter amount in Crore.'} />
            <Select label="Primary funding source" required value={form.fundingSource} onChange={set('fundingSource')} placeholder={t('common.select')} options={FUNDING_SOURCES.map((f) => ({ value: f, label: f }))} />
            <div className="md:col-span-2">
              <Progress value={Math.min(100, (amount / 100) * 100)} label="Relative scale of sanction" showValue={false} />
              <p className="mt-1 text-caption text-fg-subtle">Amounts above ₹100 Cr route to the State Level Standing Committee.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField label="Administrative approval date" type="date" value={form.adminApprovalDate} onChange={set('adminApprovalDate')} />
            <TextField label="Technical approval date" type="date" value={form.technicalApprovalDate} onChange={set('technicalApprovalDate')} />
            <TextField label="Expected completion" required type="date" value={form.expectedCompletion} onChange={set('expectedCompletion')} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-2">
            <p className="text-body-small text-fg-muted">
              Milestones are drafted from the project template after sanction (e.g., land handover, earthwork, structure, finishing). They can be edited post-creation on the project record.
            </p>
            <ul className="flex flex-col gap-1.5 text-body-small text-fg">
              {['Land acquisition & utility shifting', 'Earthwork & subgrade', 'Structure / main works', 'Finishing, signage & safety'].map((m) => (
                <li key={m} className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">check_circle</span>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 5 && (
          <p className="text-body-small text-fg-muted">
            Contractor appointment is made through Tender & Procurement after technical sanction. Leave blank for projects at the pre-tender stage.
          </p>
        )}

        {step === 6 && (
          <p className="text-body-small text-fg-muted">
            Scanned copies of Administrative Approval, Technical Sanction and the Work Order are attached from Documents & Archives after registration. This demo does not upload files.
          </p>
        )}

        {step === 7 && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-1 gap-2 text-body-small sm:grid-cols-2">
              <div><dt className="text-fg-subtle">Name</dt><dd className="text-fg">{form.name || '—'}</dd></div>
              <div><dt className="text-fg-subtle">{t('common.department')}</dt><dd className="text-fg">{form.department || '—'}</dd></div>
              <div><dt className="text-fg-subtle">{t('common.district')}</dt><dd className="text-fg">{form.district || '—'}</dd></div>
              <div><dt className="text-fg-subtle">Amount</dt><dd className="tabular-nums text-fg">{formatCr(amount)}</dd></div>
              <div><dt className="text-fg-subtle">Funding</dt><dd className="text-fg">{form.fundingSource || '—'}</dd></div>
              <div><dt className="text-fg-subtle">Completion</dt><dd className="text-fg">{form.expectedCompletion || '—'}</dd></div>
            </dl>
            <Checkbox
              label="I confirm the entries are verified against the sanction file."
              checked={form.confirmChecked}
              onChange={(e) => setForm((f) => ({ ...f, confirmChecked: e.target.checked }))}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button variant="outline" icon="arrow_back" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
            {t('common.back')}
          </Button>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Step {step + 1}/{STEPS.length}</Badge>
            {step < STEPS.length - 1 ? (
              <Button icon="arrow_forward" disabled={!canNext} onClick={() => setStep(step + 1)}>
                {t('common.next')}
              </Button>
            ) : (
              <Button
                icon="task_alt"
                disabled={!canNext || submitting}
                onClick={submitProject}
              >
                {submitting ? 'Creating project…' : 'Submit for sanction'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Panel title="How sanction works" icon="info">
        <ol className="ml-4 list-decimal space-y-1 text-body-small text-fg-muted">
          <li>Administrative Approval (AA) by the competent authority.</li>
          <li>Technical Sanction (TS) by the Chief Engineer / SE as per MPWD code.</li>
          <li>Tender via e-Tender portal; award and Work Order.</li>
          <li>Execution with milestone tracking, inspections and e-MB entries.</li>
        </ol>
      </Panel>
    </div>
  )
}
