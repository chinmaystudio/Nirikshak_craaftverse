import { useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { TextField, Select } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatDate, formatFileSizeKb } from '@/utils/format'
import { ACCESS_LEVEL } from '@/utils/status'
import type { DocumentItem } from '@/types'

/** Project workspace — Document Management: repository with upload, preview,
 * version history and access control. */
export function WorkspaceDocumentsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { documents, project } = useProjectWorkspace()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [accessFilter, setAccessFilter] = useState('')
  const [preview, setPreview] = useState<DocumentItem | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [upload, setUpload] = useState({ name: '', category: 'Administrative Approval', access: 'Internal' })

  const categories = useMemo(() => [...new Set(documents.map((d) => d.category))], [documents])

  const rows = useMemo(
    () =>
      documents.filter(
        (d) =>
          (!categoryFilter || d.category === categoryFilter) &&
          (!accessFilter || d.accessLevel === accessFilter) &&
          (!search || d.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [documents, categoryFilter, accessFilter, search],
  )

  const restricted = documents.filter((d) => d.accessLevel === 'Restricted').length
  const publicDocs = documents.filter((d) => d.accessLevel === 'Public').length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Document Management"
        description="Digital repository for this project — DPR, approvals, contracts, bills, inspection and legal records with version control and access permissions."
        actions={
          <>
            <Button variant="outline" size="sm" icon="download" onClick={() => showToast('Repository index exported (demo file).', 'info')}>
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" icon="upload_file" onClick={() => setUploadOpen(true)}>
              Upload Document
            </Button>
          </>
        }
      />

      <KpiRow>
        <KpiCard label="Documents on Record" value={documents.length} icon="folder_shared" />
        <KpiCard label="Public (Citizen Portal)" value={publicDocs} icon="public" iconTone="success" />
        <KpiCard label="Restricted" value={restricted} icon="lock" iconTone={restricted ? 'warning' : 'neutral'} />
        <KpiCard label="Versioned" value={new Set(documents.map((d) => `${d.name}@v${d.version}`)).size} icon="history" iconTone="neutral" delta="Latest version shown" />
      </KpiRow>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search document name…"
        selects={[
          {
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [{ value: '', label: t('common.all') }, ...categories.map((c) => ({ value: c, label: c }))],
          },
          {
            label: 'Access',
            value: accessFilter,
            onChange: setAccessFilter,
            options: [{ value: '', label: t('common.all') }, ...(['Public', 'Internal', 'Restricted'] as const).map((x) => ({ value: x, label: x }))],
          },
        ]}
        onClear={() => {
          setSearch('')
          setCategoryFilter('')
          setAccessFilter('')
        }}
      />

      <Panel title={`Repository (${rows.length})`} icon="folder_shared" bodyClassName="p-0">
        <DataTable
          minWidth={1000}
          rows={rows}
          rowKey={(d) => d.id}
          initialSort={{ key: 'date', dir: 'desc' }}
          columns={[
            { key: 'name', header: 'Document', isRowHeader: true, render: (d) => (
              <button type="button" onClick={() => setPreview(d)} className="text-left font-medium text-fg hover:text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {d.name}
              </button>
            ) },
            { key: 'category', header: 'Type', render: (d) => <Badge tone="neutral">{d.category}</Badge> },
            { key: 'version', header: 'Version', cellClassName: 'tabular-nums', sortable: true, sortValue: (d) => d.version, render: (d) => `v${d.version}` },
            { key: 'uploadedBy', header: 'Uploaded By', render: (d) => <span className="text-caption">{d.uploadedBy}</span> },
            { key: 'date', header: 'Date', cellClassName: 'tabular-nums', sortable: true, sortValue: (d) => d.uploadedOn, render: (d) => formatDate(d.uploadedOn) },
            { key: 'access', header: 'Access', render: (d) => <StatusBadge descriptor={ACCESS_LEVEL[d.accessLevel]} size="sm" /> },
            { key: 'size', header: 'Size', cellClassName: 'tabular-nums', render: (d) => formatFileSizeKb(d.fileSizeKb) },
          ]}
          rowActions={(d) => (
            <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setPreview(d)}>
              Preview
            </Button>
          )}
          emptyState={
            <div className="p-8 text-center">
              <p className="text-body-small text-fg-muted">No documents match the current filters, or the repository is empty for this project.</p>
              <Button variant="primary" size="sm" icon="upload_file" className="mt-3" onClick={() => setUploadOpen(true)}>
                Upload Document
              </Button>
            </div>
          }
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Preview drawer */}
      <Drawer open={preview !== null} onClose={() => setPreview(null)} title={preview ? 'Document Preview' : ''} titleIcon="description" width="max-w-lg">
        {preview && (
          <div className="flex flex-col gap-4 p-4">
            <div className="nk-card flex aspect-[4/3] flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="material-symbols-outlined text-[40px] text-fg-subtle" aria-hidden="true">description</span>
              <p className="text-caption text-fg-muted">Preview placeholder — {preview.name}</p>
              <p className="text-caption text-fg-subtle">{formatFileSizeKb(preview.fileSizeKb)} • v{preview.version}</p>
            </div>
            <Panel title="Metadata" icon="info">
              <dl className="grid grid-cols-2 gap-3 text-body-small">
                <div className="col-span-2"><dt className="text-fg-subtle">Name</dt><dd className="text-fg">{preview.name}</dd></div>
                <DetailField label="Category" value={preview.category} />
                <DetailField label="Access level" value={<StatusBadge descriptor={ACCESS_LEVEL[preview.accessLevel]} size="sm" />} />
                <DetailField label="Uploaded by" value={preview.uploadedBy} />
                <DetailField label="Uploaded on" value={formatDate(preview.uploadedOn)} />
                <DetailField label="Version" value={`v${preview.version}`} />
                <DetailField label="Signed by" value={preview.signedBy ?? '—'} />
                <DetailField label="Expiry" value={preview.expiryDate ? formatDate(preview.expiryDate) : '—'} />
                <DetailField label="Related project" value={<span className="nk-mono-id">{preview.projectId ?? project?.id ?? '—'}</span>} />
              </dl>
            </Panel>
            <Panel title="Version History" icon="history" bodyClassName="p-0">
              <ol className="divide-y divide-border">
                {Array.from({ length: preview.version }, (_, i) => preview.version - i).map((v) => (
                  <li key={v} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="text-body-small text-fg">v{v}</span>
                    <span className="text-caption text-fg-subtle">
                      {v === preview.version ? `Current — ${formatDate(preview.uploadedOn)} • ${preview.uploadedBy}` : 'Superseded'}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="border-t border-border p-3 text-caption text-fg-subtle">
                Superseded versions remain retrievable for audit; deletion is prohibited in the append-only repository.
              </p>
            </Panel>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon="download" onClick={() => showToast(`"${preview.name}" download started (demo file).`, 'info')}>
                Download
              </Button>
              <Button variant="outline" size="sm" icon="share" onClick={() => showToast(`Share link for "${preview.name}" generated with access watermark (demo).`, 'info')}>
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="archive"
                onClick={() => {
                  showToast(`"${preview.name}" archived — retained for audit, hidden from default view (demo).`, 'info')
                  setPreview(null)
                }}
              >
                Archive
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        titleIcon="upload_file"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!upload.name.trim()}
              onClick={() => {
                showToast(`"${upload.name.trim()}" uploaded (${upload.category}, ${upload.access}) — queued for DSC signature (demo).`, 'success')
                setUpload({ name: '', category: 'Administrative Approval', access: 'Internal' })
                setUploadOpen(false)
              }}
            >
              {t('common.upload')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="nk-card flex items-center justify-center gap-2 border-dashed p-6 text-caption text-fg-muted">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">upload</span>
            Drop file here or browse (demo — no actual upload)
          </div>
          <TextField label="Document name" required value={upload.name} onChange={(e) => setUpload((f) => ({ ...f, name: e.target.value }))} />
          <Select
            label="Category"
            value={upload.category}
            onChange={(e) => setUpload((f) => ({ ...f, category: e.target.value }))}
            options={['Administrative Approval', 'Technical Approval', 'Work Order', 'Tender Document', 'Contract Agreement', 'Inspection Report', 'Financial Record', 'Site Photograph'].map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Access level"
            value={upload.access}
            onChange={(e) => setUpload((f) => ({ ...f, access: e.target.value }))}
            options={['Public', 'Internal', 'Restricted'].map((c) => ({ value: c, label: c }))}
          />
        </div>
      </Modal>
    </div>
  )
}
