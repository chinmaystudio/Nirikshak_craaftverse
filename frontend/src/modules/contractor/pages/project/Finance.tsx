import { useMemo, useState } from 'react';
import { Wallet, Download, Eye, IndianRupee, Landmark, Banknote, FileSignature } from 'lucide-react';
import { Card, SectionTitle, KPISection, StatusBadge, Modal } from '../../components/ui';
import { Link } from '../../lib/router';
import type { KPIItem } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { StepFlow, Donut } from '../../components/charts';
import { useStore } from '../../lib/store';
import type { Project, Invoice } from '../../lib/data';
import { downloadFile, fmtDate, money } from '../../lib/utils';

export default function Finance({ project }: { project: Project }) {
  const { invoices, toast } = useStore();
  const [view, setView] = useState<Invoice | null>(null);

  const projectBills = useMemo(() => invoices.filter((i) => i.projectId === project.id), [invoices, project.id]);
  const paid = projectBills.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const pending = projectBills.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const rejected = projectBills.filter((i) => i.status === 'Rejected').reduce((s, i) => s + i.amount, 0);
  const remaining = project.value - project.spent;

  const currentStage = pending > 2e7 ? 'Government Verification' : pending > 0 ? 'Bill Approved' : 'Payment Released';

  const kpis: KPIItem[] = [
    { label: 'Contract Value', value: `₹ ${project.value.toFixed(2)} Cr`, icon: Landmark },
    { label: 'Approved Budget', value: `₹ ${project.budgetApproved.toFixed(2)} Cr`, icon: IndianRupee },
    { label: 'Amount Received', value: `₹ ${project.received.toFixed(2)} Cr`, sub: `${Math.round((project.received / project.value) * 100)}% of value`, icon: Banknote, iconClass: 'text-green-600' },
    { label: 'Amount Pending', value: money(pending), sub: `${projectBills.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).length} bills`, icon: Banknote, iconClass: 'text-amber-500' },
    { label: 'Amount Spent', value: `₹ ${project.spent.toFixed(2)} Cr`, sub: `${Math.round((project.spent / project.value) * 100)}% of contract`, icon: Wallet, iconClass: 'text-blue-600' },
    { label: 'Remaining Amount', value: `₹ ${remaining.toFixed(2)} Cr`, icon: Wallet },
  ];

  const workflowSteps = [
    { label: 'Work Completed', state: 'done' as const, note: `${project.progress}% progress certified` },
    { label: 'Bill Submitted', state: 'done' as const, note: projectBills[0] ? `Latest: ${projectBills[0].no}` : '—' },
    { label: 'Government Verification', state: pending > 0 && currentStage === 'Government Verification' ? ('current' as const) : ('done' as const), note: `${money(pending)} in process` },
    { label: 'Bill Approved', state: currentStage === 'Bill Approved' ? ('current' as const) : projectBills.some((i) => i.status === 'Approved' || i.status === 'Paid') ? ('done' as const) : ('pending' as const) },
    { label: 'Payment Released', state: paid > 0 ? ('done' as const) : ('pending' as const), note: paid > 0 ? `${money(paid)} received` : undefined },
  ];

  const expenses = project.expenses;

  return (
    <div className="space-y-6">
      <KPISection items={kpis} />

      <Card className="p-5">
        <SectionTitle icon={FileSignature} title="Payment Workflow" right={<Link to={`/projects/${project.id}/bills`} className="link text-sm">Manage bills</Link>} />
        <StepFlow steps={workflowSteps} />
        <p className="text-[11px] text-slate-500 mt-4 font-medium dark:text-slate-400">
          Monthly RA bills follow the department's verification SLA (21 days from DyE check). Follow up in writing when a bill crosses the SLA.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={Banknote} title={`Payment History — ${project.name}`} />
          <DataTable
            
            columns={[
              { key: 'no', label: 'Bill No.', sortVal: (i: Invoice) => i.no, render: (i: Invoice) => <span className="text-xs font-bold font-mono">{i.no}</span> },
              { key: 'milestone', label: 'Milestone', render: (i: Invoice) => <span className="text-xs font-semibold">{i.milestone}</span> },
              { key: 'amount', label: 'Amount', sortVal: (i: Invoice) => i.amount, render: (i: Invoice) => <span className="text-xs font-bold tabular-nums">{money(i.amount)}</span> },
              { key: 'date', label: 'Submitted', sortVal: (i: Invoice) => i.date, render: (i: Invoice) => <span className="text-xs">{fmtDate(i.date)}</span> },
              { key: 'status', label: 'Status', sortVal: (i: Invoice) => i.status, render: (i: Invoice) => <StatusBadge status={i.status} /> },
              { key: 'paid', label: 'Payment Date', render: (i: Invoice) => <span className="text-xs">{i.paidDate ? fmtDate(i.paidDate) : '—'}</span> },
              {
                key: 'action',
                label: 'Action',
                render: (i: Invoice) => (
                  <div className="flex gap-1.5">
                    <button className="btn btn-ghost btn-sm" onClick={() => setView(i)} aria-label={`View ${i.no}`}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {i.status === 'Paid' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        aria-label={`Download receipt ${i.no}`}
                        onClick={() => {
                          downloadFile(`Receipt_${i.no}.txt`, `NIRIKSHAK Payment Receipt (Demo)\n\nBill: ${i.no}\nProject: ${project.name}\nAmount: ${money(i.amount)}\nPaid on: ${fmtDate(i.paidDate!)}\nMode: RTGS — Treasury, Government of Maharashtra`);
                          toast('success', 'Receipt downloaded', i.no);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={projectBills}
            empty={<p className="text-sm text-slate-500 py-10 text-center font-medium">No bills submitted for this project yet.</p>}
          />
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Wallet} title="Expenditure Breakdown" />
          <div className="flex flex-col items-center">
            <Donut
              segments={expenses.map((e, i) => ({ value: e.spent, color: ['bg-blue-700', 'bg-blue-400', 'bg-green-600', 'bg-amber-600', 'bg-slate-400'][i], label: e.label }))}
              center={{ big: `₹${project.spent.toFixed(1)}Cr`, small: 'spent' }}
            />
            <div className="flex flex-col gap-2 mt-5 w-full">
              {expenses.map((e, i) => (
                <div key={e.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium dark:text-slate-300">
                    <span className={`w-2.5 h-2.5 rounded-sm shrink-0`} style={{ background: ['#1d4ed8', '#60a5fa', '#16a34a', '#d97706', '#94a3b8'][i] }} />
                    {e.label}
                  </div>
                  <span className="font-bold text-slate-800 tabular-nums dark:text-slate-200">₹ {e.spent.toFixed(2)} Cr</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-4 font-medium dark:text-slate-400">
              {rejected > 0 && <>1 bill of {money(rejected)} was rejected on rate mismatch and is being corrected. </>}
              Remaining budget: ₹ {remaining.toFixed(2)} Cr for the balance scope.
            </p>
          </div>
        </Card>
      </div>

      {/* Bill detail modal */}
      <Modal open={view !== null} onClose={() => setView(null)} title={view ? `Bill ${view.no}` : ''}>
        {view && (
          <div className="space-y-4">
            <dl className="space-y-2.5">
              <DRow k="Project" v={project.name} />
              <DRow k="Milestone" v={view.milestone} />
              <DRow k="Amount" v={money(view.amount)} />
              <DRow k="Submitted" v={fmtDate(view.date)} />
              <DRow k="Status" v="" badge={<StatusBadge status={view.status} />} />
              <DRow k="Verification" v={view.verification ?? '—'} />
              {view.paidDate && <DRow k="Payment Date" v={fmtDate(view.paidDate)} />}
              {view.note && <DRow k="Note" v={view.note} />}
            </dl>
            <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Status Trail</p>
              <ol className="text-xs text-slate-600 space-y-1.5 dark:text-slate-400">
                <li>1. Submitted by contractor — {fmtDate(view.date)}</li>
                <li>2. DyE measurement check {view.status === 'Submitted' ? '— pending' : '— done'}</li>
                <li>3. EE / SE verification {['Paid', 'Approved'].includes(view.status) || view.status === 'Under Verification' ? '— recorded' : '— pending'}</li>
                <li>4. Treasury release {view.paidDate ? `— ${fmtDate(view.paidDate)}` : '— pending'}</li>
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DRow({ k, v, badge }: { k: string; v: string; badge?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="dl-label">{k}</dt>
      <dd className="dl-value text-right">{badge ?? v}</dd>
    </div>
  );
}