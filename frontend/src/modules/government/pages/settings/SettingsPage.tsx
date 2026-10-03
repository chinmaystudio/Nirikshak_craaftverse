import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AccessibilityMenuContent } from '@/components/accessibility/AccessibilityMenu'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { PRIORITY } from '@/utils/status'
import { LOCALES } from '@/locales/config'

const ROLE_MATRIX = [
  { role: 'Chief Engineer / PD', projects: 'Full', finance: 'View + approve', approvals: 'Approve', admin: 'Full' },
  { role: 'Superintending Engineer', projects: 'Circle scope', finance: 'View', approvals: 'Recommend', admin: 'None' },
  { role: 'Executive Engineer', projects: 'Division scope', finance: 'View', approvals: 'Forward', admin: 'None' },
  { role: 'Section Officer', projects: 'View', finance: 'View', approvals: 'Draft', admin: 'None' },
  { role: 'Auditor (read-only)', projects: 'View', finance: 'View', approvals: 'View', admin: 'None' },
] as const

/**
 * SettingsPage — Settings & Roles: display language, accessibility, theme,
 * demo session, and the role-permission matrix. No user administration is
 * performed here (demo build has no backend).
 */
export function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { officer } = useAuth()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.settings')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Preferences and role information for this demonstration session (mock data).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Display language" icon="translate" subtitle="English, हिन्दी and मराठी are fully supported.">
          <Select
            label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            options={LOCALES.map((l) => ({ value: l.code, label: l.nativeLabel }))}
            helper="The interface language applies across the platform."
          />
        </Panel>

        <Panel title="Theme" icon="dark_mode" subtitle="Dark mode uses a deep grey canvas — never pure black.">
          <Select
            label="Appearance"
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'Match system' },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Accessibility" icon="accessibility_new" subtitle="Text size, contrast, theme and motion — same controls as the header menu.">
        <AccessibilityMenuContent />
      </Panel>

      <Panel title="Session" icon="badge" subtitle="Demo authentication — no real government identity provider is connected.">
        <dl className="grid grid-cols-1 gap-2 text-body-small sm:grid-cols-2">
          <div><dt className="text-fg-subtle">Officer</dt><dd className="text-fg">{officer?.name ?? '—'}</dd></div>
          <div><dt className="text-fg-subtle">Designation</dt><dd className="text-fg">{officer?.designation ?? '—'}</dd></div>
          <div><dt className="text-fg-subtle">Department</dt><dd className="text-fg">{officer?.department ?? '—'}</dd></div>
          <div><dt className="text-fg-subtle">Employee No.</dt><dd className="nk-mono-id text-fg">{officer?.employeeNo ?? '—'}</dd></div>
          <div className="sm:col-span-2">
            <dt className="text-fg-subtle">Roles</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {(officer?.roles ?? []).map((r) => (
                <Badge key={r} tone="secondary" icon="verified">{r}</Badge>
              ))}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Role & permission matrix" icon="admin_panel_settings" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-body">
            <thead>
              <tr className="nk-table-header">
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-3 py-2.5 text-left">Projects</th>
                <th className="px-3 py-2.5 text-left">Finance</th>
                <th className="px-3 py-2.5 text-left">Approvals</th>
                <th className="px-3 py-2.5 text-left">Administration</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map((r) => (
                <tr key={r.role} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-fg">{r.role}</th>
                  <td className="px-3 py-2.5 text-body-small text-fg-muted">{r.projects}</td>
                  <td className="px-3 py-2.5 text-body-small text-fg-muted">{r.finance}</td>
                  <td className="px-3 py-2.5 text-body-small text-fg-muted">{r.approvals}</td>
                  <td className="px-3 py-2.5 text-body-small text-fg-muted">{r.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Data & disclaimers" icon="privacy_tip">
        <ul className="flex flex-col gap-2 text-body-small text-fg">
          <li className="flex items-start gap-2">
            <StatusBadge descriptor={PRIORITY.medium} size="sm" />
            All records in this build are demo data; nothing is persisted to a backend.
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge descriptor={PRIORITY.low} size="sm" />
            No real authentication (NIC / Parichay / SSO) is integrated — the sign-in flow is illustrative only.
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge descriptor={PRIORITY.low} size="sm" />
            AI outputs are advisory and always carry officer-review disclaimers.
          </li>
        </ul>
        <p className="mt-3 text-caption text-fg-subtle">
          Demo session storage keys: <span className="nk-mono-id">nirikshak.session</span>, <span className="nk-mono-id">nirikshak.locale</span>,{' '}
          <span className="nk-mono-id">nirikshak.theme</span>. Clear browser site data to reset.
        </p>
      </Panel>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-body-small text-fg-muted">Version 2.4.1 — demonstration build for review.</p>
        <Button variant="outline" size="sm" icon="download" onClick={() => undefined}>
          Export my preferences (demo)
        </Button>
      </Card>
    </div>
  )
}
