import { useState } from 'react';
import { FileUp, Info, Send, Save } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Field, Select, DocumentUploader, ConfirmModal, Modal } from '../../components/ui';
import type { UploadDoc } from '../../components/ui';
import { useStore } from '../../lib/store';
import type { Project } from '../../lib/data';
import { cls, fmtDate, timeAgo } from '../../lib/utils';

export default function ReportUpdate({ project }: { project: Project }) {
  const { reports, addReport, toast } = useStore();
  const current = project.milestones.find((m) => m.state === 'current');
  const [milestone, setMilestone] = useState(current?.name ?? project.milestones[0]?.name ?? '');
  const [progress, setProgress] = useState(String(Math.max(project.progress, 1)));
  const [completed, setCompleted] = useState('');
  const [planned, setPlanned] = useState('');
  const [challenges, setChallenges] = useState('');
  const [photos, setPhotos] = useState<UploadDoc[]>([]);
  const [docs, setDocs] = useState<UploadDoc[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const mine = reports.filter((r) => r.projectId === project.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const sinceLast = Number(progress) - project.progress;

  const reset = () => {
    setCompleted('');
    setPlanned('');
    setChallenges('');
    setPhotos([]);
    setDocs([]);
  };

  const validate = () => {
    if (!completed.trim()) {
      toast('warn', 'Work completed is required', 'Describe the physical work completed this period.');
      return false;
    }
    return true;
  };

  const saveDraft = () => {
    if (!validate()) return;
    addReport({
      projectId: project.id,
      milestone,
      progress: Number(progress) || project.progress,
      prevProgress: project.progress,
      completed,
      planned,
      challenges,
      photos: photos.map((p) => p.name),
      docs: docs.map((d) => d.name),
      status: 'Draft',
    });
    toast('success', 'Draft saved', 'The progress update is saved as a draft. Submit when ready.');
    reset();
  };

  const submit = async () => {
    if (!validate()) return;
    addReport({
      projectId: project.id,
      milestone,
      progress: Number(progress) || project.progress,
      prevProgress: project.progress,
      completed,
      planned,
      challenges,
      photos: photos.map((p) => p.name),
      docs: docs.map((d) => d.name),
      status: 'Under Government Review',
    });

    try {
      const { supabase } = await import('@/core/supabase/client');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(project.id);
      let targetProjectId = isUuid ? project.id : null;
      if (!targetProjectId) {
        const { data: projData } = await supabase
          .from('projects')
          .select('id')
          .eq('nirikshak_project_id', project.code || project.id)
          .maybeSingle();
        if (projData) targetProjectId = (projData as any).id;
      }

      if (targetProjectId) {
        const summary = [
          completed ? `Completed: ${completed}` : '',
          planned ? `Planned: ${planned}` : '',
          challenges ? `Challenges: ${challenges}` : '',
        ].filter(Boolean).join('\n');

        const { error: rpcErr } = await supabase.rpc('submit_progress_update', {
          p_project_id: targetProjectId,
          p_reported_progress: Number(progress) || project.progress,
          p_description: summary || 'Physical progress update submitted via Contractor Portal.',
          p_milestone_id: null,
        });

        if (rpcErr) {
          console.warn('Live Supabase progress update notice:', rpcErr.message);
        } else {
          toast('success', 'Submitted to Government', 'Update has been submitted for official verification.');
        }
      }
    } catch (e) {
      console.warn('Supabase submit_progress_update dispatch notice:', e);
    }

    setConfirmOpen(false);
    setSuccessOpen(true);
    reset();
  };

  const statusTone = (s: string) => (s === 'Approved' ? 'Approved' : s === 'Changes Requested' ? 'Changes Requested' : s === 'Draft' ? 'Draft' : 'Under Government Review');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
      <Card className="p-5">
        <SectionTitle icon={FileUp} title="Progress Report" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Project">
            <input className="input bg-slate-100 dark:bg-slate-800/70" value={project.name} readOnly />
          </Field>
          <Field label="Milestone" required>
            <Select
              value={milestone}
              onChange={setMilestone}
              options={project.milestones.map((m) => ({ value: m.name, label: m.name }))}
            />
          </Field>
          <Field label="Current Progress (%)" required hint={`Last reported: ${project.progress}%`}>
            <div className="flex items-center gap-3">
              <input
                className="input w-24"
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Number(progress) || 0}
                onChange={(e) => setProgress(e.target.value)}
                className="flex-1 accent-blue-700 cursor-pointer"
                aria-label="Progress percentage slider"
              />
            </div>
          </Field>
          <Field label="Progress Since Last Update">
            <input
              className="input bg-slate-100 dark:bg-slate-800/70"
              value={`${sinceLast >= 0 ? '+' : ''}${sinceLast}% vs last reported ${project.progress}%`}
              readOnly
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Work Completed" required>
              <textarea className="input min-h-[100px]" value={completed} onChange={(e) => setCompleted(e.target.value)} placeholder="Physical work completed this period — quantities, locations, test results…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Work Planned (Next Period)">
              <textarea className="input min-h-[80px]" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder="Planned activities for the next reporting period…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Challenges / Issues">
              <textarea className="input min-h-[70px]" value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Delays, resource issues, land/handover matters, weather…" />
            </Field>
          </div>
          <div>
            <DocumentUploader label="Upload Site Photos" accept="image/*" docs={photos} onChange={setPhotos} />
          </div>
          <div>
            <DocumentUploader label="Upload Documents" docs={docs} onChange={setDocs} />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5 mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button className="btn btn-secondary" onClick={saveDraft}>
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button className="btn btn-primary" onClick={() => validate() && setConfirmOpen(true)}>
            <Send className="w-4 h-4" />
            Submit Update
          </button>
        </div>
      </Card>

      {/* History & guidance */}
      <div className="space-y-6">
        <Card className="p-5">
          <SectionTitle icon={Info} title="Submission Status" />
          {mine.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium py-6 text-center dark:text-slate-400">
              No updates submitted for this project yet. Weekly submission is expected per contract clause 14.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {mine.map((r) => (
                <div key={r.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {r.progress}% • {r.milestone}
                    </p>
                    <StatusBadge status={statusTone(r.status)} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium dark:text-slate-400">
                    {timeAgo(r.submittedAt)} • {r.docs.length} docs, {r.photos.length} photos
                  </p>
                  {r.reviewerNote && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 rounded-md px-2.5 py-1.5 mt-2 font-semibold dark:bg-amber-950/40 dark:text-amber-300">
                      {r.reviewerNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Info} title="What Officers Check" />
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {[
              'Progress claim matches measurement book entries',
              'Site photos are dated and show the reported work',
              'Test reports (cube, density, bitumen) accompany layer work',
              'Challenges are supported by earlier correspondence',
              'Labour and safety registers are up to date',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-1.5 shrink-0 dark:bg-blue-400" />
                {t}
              </li>
            ))}
          </ul>
        </Card>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 mb-1.5 dark:text-blue-300">Reporting Lifecycle</p>
          <div className="flex flex-wrap gap-1.5">
            {['Submitted', 'Under Government Review', 'Approved', 'Changes Requested'].map((s) => (
              <span key={s} className={cls('text-[10px] font-bold rounded-md border px-2 py-1', 'border-blue-200 text-blue-800 dark:border-blue-900 dark:text-blue-300')}>
                {s}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 dark:text-slate-400">Last project update: {fmtDate(project.lastUpdate)} — {project.lastUpdateNote}</p>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Submit progress update?"
        message={`The update (${progress}%, ${milestone}) will be submitted to ${project.department} for verification and enters “Under Government Review” status.`}
        confirmLabel="Submit Update"
      />

      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Update Submitted"
        width="max-w-md"
        footer={
          <button className="btn btn-primary" onClick={() => setSuccessOpen(false)}>
            Done
          </button>
        }
      >
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3 dark:bg-green-950/60 dark:border-green-900">
            <Send className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Progress update submitted</p>
          <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">
            Status is now <StatusBadge status="Under Government Review" />. You will be notified when the officer reviews it.
          </p>
        </div>
      </Modal>
    </div>
  );
}
