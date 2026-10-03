import { FileText, ClipboardList, CalendarClock, Download, Upload } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Timeline, ProgressBar, DocumentUploader } from '../../components/ui';
import { Link } from '../../lib/router';
import type { UploadDoc } from '../../components/ui';
import { useStore } from '../../lib/store';
import type { Project } from '../../lib/data';
import { useState } from 'react';
import { cls, cr, downloadFile, fmtDate, fmtDateShort, daysUntil } from '../../lib/utils';

export default function ProjectDetails({ project }: { project: Project }) {
  const { documents, addDocument, toast } = useStore();
  const [docs, setDocs] = useState<UploadDoc[]>([]);
  const docsList = documents[project.id] ?? [];
  const elapsedDays = Math.max(0, daysUntil(project.start) * -1);
  const totalDays = daysUntil(project.start) * -1 + daysUntil(project.deadline);

  const submitDocs = () => {
    if (docs.length === 0) {
      toast('warn', 'No file selected');
      return;
    }
    docs.forEach((d) => addDocument(project.id, { name: d.name, type: 'Contract Document', size: d.size }));
    toast('success', `${docs.length} document${docs.length > 1 ? 's' : ''} uploaded`);
    setDocs([]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information */}
        <Card className="p-5">
          <SectionTitle icon={FileText} title="Project Information" />
          <dl className="space-y-3.5">
            <Info k="Department" v={project.department || 'Infrastructure Works'} />
            <Info k="Government Officer" v={`${project.officer || 'Executive Engineer'} — ${project.officerRole || 'Officer in Charge'}`} />
            <Info k="Location" v={`${project.location || 'Pune'}, ${project.district || 'Pune'} district`} />
            <Info k="Contract Value" v={cr(project.value || 0)} />
            <Info k="Approved Budget" v={cr(project.budgetApproved || project.value || 0)} />
            <Info k="Start Date" v={fmtDate(project.start)} />
            <Info k="Expected Completion" v={fmtDate(project.deadline)} />
            <Info k="Contractor" v="Balaji Infraprojects Pvt. Ltd. (Class-A)" />
            <Info k="Contract Status" v="" badge={<StatusBadge status={project.status === 'Completed' ? 'Completed' : 'Active'} />} />
            <Info k="Work Order" v={project.workOrder || 'WO-MH-2026-001'} mono />
          </dl>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">Scope of Work</p>
            <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{project.scope || 'Standard engineering contract scope'}</p>
          </div>
        </Card>

        {/* Project Status */}
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle icon={ClipboardList} title="Project Status" />
            <div className="mb-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Overall Progress</span>
                <span className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100">{project.progress || 0}%</span>
              </div>
              <ProgressBar value={project.progress || 0} marker={project.planned || 0} height="h-3.5" />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Vertical marker indicates planned progress ({project.planned || 0}%)</p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              <Stat k="Planned" v={`${project.planned || 0}%`} />
              <Stat k="Actual" v={`${project.progress || 0}%`} />
              <Stat k="Variance" v={`${(project.progress || 0) - (project.planned || 0) > 0 ? '+' : ''}${(project.progress || 0) - (project.planned || 0)}%`} tone={(project.progress || 0) - (project.planned || 0) < 0 ? 'bad' : 'good'} />
            </dl>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Days Elapsed</p>
                <p className="font-display font-bold text-lg text-slate-800 mt-0.5 dark:text-slate-100">{elapsedDays}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Contract Days Left</p>
                <p className={cls('font-display font-bold text-lg mt-0.5', daysUntil(project.deadline) < 0 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100')}>{Math.max(0, daysUntil(project.deadline))}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={CalendarClock} title="Project Timeline" />
            <Timeline
              items={project.milestones.map((m) => ({
                label: m.name,
                date: fmtDate(m.date),
                state: m.state,
                note: m.progress !== undefined && m.state === 'current' ? `${m.progress}% of this milestone completed` : undefined,
              }))}
            />
          </Card>
        </div>
      </div>

      {/* Documents */}
      <Card>
        <div className="p-5 pb-4 flex items-center justify-between">
          <SectionTitle icon={FileText} title={`Contract Documents (${docsList.length})`} className="mb-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {docsList.map((d) => (
                <tr key={d.id}>
                  <td className="font-bold text-slate-800 dark:text-slate-100">{d.name}</td>
                  <td><span className="text-[11px] font-bold bg-slate-100 rounded px-1.5 py-0.5 dark:bg-slate-800">{d.type}</span></td>
                  <td className="text-xs">{d.size}</td>
                  <td className="text-xs">{fmtDate(d.uploaded)}</td>
                  <td className="text-xs">{d.by}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => downloadFile(d.name.replace(/\s+/g, '_'), `NIRIKSHAK document extract — ${d.name}\n\nThis is a demonstration file generated by the Contractor Portal for ${project.name} (${project.code}).`)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {docsList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-slate-500">No documents on record yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <DocumentUploader label="Upload additional documents" docs={docs} onChange={setDocs} />
          <div className="flex justify-end mt-3">
            <button className="btn btn-primary btn-sm" onClick={submitDocs}>
              <Upload className="w-3.5 h-3.5" />
              Upload to Project Record
            </button>
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-slate-400 text-center">
        Project register entry last verified {fmtDateShort(new Date())} • Work order {project.workOrder} • Duration {totalDays} days
      </p>
      <Link to={`/projects/${project.id}/analytics`} className="link text-sm w-max mx-auto block">View detailed analytics →</Link>
    </div>
  );
}

function Info({ k, v, badge, mono }: { k: string; v: string; badge?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="dl-label">{k}</dt>
      <dd className={cls('dl-value text-right', mono && 'font-mono text-xs')}>{badge ?? v}</dd>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{k}</p>
      <p className={cls('font-display font-bold text-lg mt-0.5', tone === 'bad' ? 'text-red-600' : tone === 'good' ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-slate-100')}>{v}</p>
    </div>
  );
}
