import { useMemo, useState } from 'react';
import { Receipt, Plus, Send, Eye } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Tabs, Field, Select, Modal } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { StepFlow } from '../../components/charts';
import { useStore } from '../../lib/store';
import { PROJECTS } from '../../lib/data';
import type { Invoice, InvoiceStatus, Project } from '../../lib/data';
import { fmtDate, money } from '../../lib/utils';

const GROUPS: { key: string; label: string; statuses: InvoiceStatus[] }[] = [
  { key: 'all', label: 'All', statuses: ['Draft', 'Submitted', 'Under Verification', 'Approved', 'Rejected', 'Paid'] },
  { key: 'draft', label: 'Draft', statuses: ['Draft'] },
  { key: 'submitted', label: 'Submitted / Verification', statuses: ['Submitted', 'Under Verification'] },
  { key: 'approved', label: 'Approved', statuses: ['Approved'] },
  { key: 'paid', label: 'Paid', statuses: ['Paid'] },
  { key: 'rejected', label: 'Rejected', statuses: ['Rejected'] },
];

export default function Bills({ project }: { project: Project }) {
  const { invoices, addInvoice, submitInvoice, toast } = useStore();
  const [group, setGroup] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const mine = useMemo(() => invoices.filter((i) => i.projectId === project.id), [invoices, project.id]);
  const rows = useMemo(() => mine.filter((i) => GROUPS.find((g) => g.key === group)!.statuses.includes(i.status)), [mine, group]);

  const totals = useMemo(
    () => ({
      billed: mine.reduce((s, i) => s + (i.status === 'Draft' || i.status === 'Rejected' ? 0 : i.amount), 0),
      paid: mine.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0),
      outstanding: mine.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).reduce((s, i) => s + i.amount, 0),
    }),
    [mine]
  );

  const nextNo = `INV-2026-${String(196 + mine.length).padStart(4, '0')}`;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Billed (verified)', value: money(totals.billed), cls: 'text-slate-800 dark:text-slate-100' },
          { label: 'Paid', value: money(totals.paid), cls: 'text-green-700 dark:text-green-400' },
          { label: 'Outstanding', value: money(totals.outstanding), cls: 'text-amber-700 dark:text-amber-400' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{s.label}</p>
            <p className={`font-display font-bold text-2xl tracking-tight mt-1.5 ${s.cls}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <SectionTitle icon={Receipt} title="Bill Lifecycle" />
        <StepFlow
          steps={[
            { label: 'Draft', state: 'done', note: `${mine.filter((i) => i.status === 'Draft').length} draft` },
            { label: 'Submitted', state: 'done', note: `${mine.filter((i) => i.status === 'Submitted').length} in queue` },
            { label: 'Under Verification', state: mine.some((i) => i.status === 'Under Verification') ? 'current' : 'done' },
            { label: 'Approved', state: mine.some((i) => i.status === 'Approved') ? 'done' : 'pending' },
            { label: 'Paid', state: mine.some((i) => i.status === 'Paid') ? 'done' : 'pending' },
          ]}
        />
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <SectionTitle icon={Receipt} title={`Bills & Invoices — ${project.name}`} className="mb-0" />
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
          <div className="mt-4 -mx-5">
            <Tabs tabs={GROUPS.map((g) => ({ key: g.key, label: g.label, count: mine.filter((i) => g.statuses.includes(i.status)).length }))} active={group} onChange={setGroup} />
          </div>
        </div>

        <DataTable
          
          columns={[
            { key: 'no', label: 'Invoice No.', sortVal: (i: Invoice) => i.no, render: (i: Invoice) => <span className="text-xs font-bold font-mono">{i.no}</span> },
            { key: 'milestone', label: 'Bill / Milestone', render: (i: Invoice) => <span className="text-xs font-semibold">{i.milestone}</span> },
            { key: 'amount', label: 'Amount', sortVal: (i: Invoice) => i.amount, render: (i: Invoice) => <span className="text-xs font-bold tabular-nums">{money(i.amount)}</span> },
            { key: 'date', label: 'Date', sortVal: (i: Invoice) => i.date, render: (i: Invoice) => <span className="text-xs">{fmtDate(i.date)}</span> },
            { key: 'status', label: 'Status', sortVal: (i: Invoice) => i.status, render: (i: Invoice) => <StatusBadge status={i.status} /> },
            { key: 'ver', label: 'Govt. Verification', render: (i: Invoice) => <span className="text-xs">{i.verification ?? '—'}</span> },
            { key: 'paid', label: 'Payment Date', render: (i: Invoice) => <span className="text-xs">{i.paidDate ? fmtDate(i.paidDate) : '—'}</span> },
            {
              key: 'action',
              label: 'Action',
              render: (i: Invoice) => (
                <div className="flex gap-1.5">
                  {i.status === 'Draft' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        submitInvoice(i.id);
                        toast('success', 'Bill submitted', `${i.no} forwarded for government verification.`);
                      }}
                    >
                      <Send className="w-3 h-3" />
                      Submit
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      toast('info', `Bill ${i.no}`, i.note ?? i.verification ?? `Status: ${i.status}. ${i.paidDate ? `Paid on ${fmtDate(i.paidDate)}.` : ''}`);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Details
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
          empty={<p className="text-sm text-slate-500 py-10 text-center font-medium">No bills in this stage.</p>}
        />
      </Card>

      <CreateInvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        nextNo={nextNo}
        defaultProject={project.id}
        onSubmit={(inv) => {
          addInvoice(inv);
          toast('success', 'Draft invoice created', `${inv.no} saved as draft. Submit when ready.`);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function CreateInvoiceModal({
  open,
  onClose,
  nextNo,
  defaultProject,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nextNo: string;
  defaultProject: string;
  onSubmit: (inv: Omit<Invoice, 'id'>) => void;
}) {
  const [projectId, setProjectId] = useState(defaultProject);
  const [milestone, setMilestone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const valid = milestone.trim().length > 3 && Number(amount) > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Create Invoice — ${nextNo}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onSubmit({
                no: nextNo,
                projectId,
                milestone,
                amount: Number(amount),
                date,
                status: 'Draft',
                note: notes || undefined,
              })
            }
          >
            Save Draft
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Project">
          <Select value={projectId} onChange={setProjectId} options={PROJECTS.map((p) => ({ value: p.id, label: p.name }))} />
        </Field>
        <Field label="Invoice Date">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Bill / Milestone Description" required>
          <input className="input" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="e.g. RA Bill 9 — Wearing Course Zone 1" />
        </Field>
        <Field label="Amount (₹)" required hint="Enter gross amount including taxes">
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1850000" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Notes (optional)">
            <textarea className="input min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Measurement book reference, test reports enclosed, etc." />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
