import { useMemo, useState } from 'react';
import { MessagesSquare, Send, Paperclip, Phone, Mail, Landmark, Circle } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Field, Select, Modal, DocumentUploader, EmptyState, Avatar } from '../../components/ui';
import type { UploadDoc } from '../../components/ui';
import { useStore } from '../../lib/store';
import type { Project, Message } from '../../lib/data';
import { cls, fmtDate, fmtDateTime, timeAgo } from '../../lib/utils';

const TYPES = ['Clarification Request', 'Material / Drawing Approval', 'Extension Request (EOT)', 'Response to Notice', 'Payment Follow-up', 'General Correspondence'];

export default function Communication({ project }: { project: Project }) {
  const { messages, sendMessage, toast } = useStore();
  const thread = useMemo(() => (messages[project.id] ?? []).slice().sort((a, b) => b.ts.localeCompare(a.ts)), [messages, project.id]);
  const [selectedId, setSelectedId] = useState<string | null>(thread[0]?.id ?? null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<UploadDoc[]>([]);

  const selected = thread.find((m) => m.id === selectedId) ?? null;
  const related = selected ? thread.filter((m) => m.subject === selected.subject || m.subject === `Re: ${selected.subject}` || selected.subject === `Re: ${m.subject}`) : [];

  const send = () => {
    if (subject.trim().length < 5 || body.trim().length < 10) {
      toast('warn', 'Incomplete message', 'Subject (min 5 chars) and message (min 10 chars) are required.');
      return;
    }
    sendMessage({
      projectId: project.id,
      dir: 'out',
      from: 'Balaji Infraprojects Pvt. Ltd.',
      role: 'Contractor',
      subject,
      type: type as Message['type'],
      body,
      ref: `BIP/${project.deptAbbr}/2026-27/${Math.floor(300 + Math.random() * 700)}`,
      attachments: files.map((f) => f.name),
    });
    toast('success', 'Message sent', `Marked to ${project.officer} — acknowledgement typically within 1 working day.`);
    setComposeOpen(false);
    setSubject('');
    setBody('');
    setFiles([]);
  };

  return (
    <div className="space-y-5">
      {/* Officer card */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={project.officer} className="w-11 h-11" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{project.officer}</p>
              <p className="text-xs text-slate-500 font-semibold dark:text-slate-400">{project.officerRole}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{project.officerPhone}</span>
                <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{project.officerEmail}</span>
                <span className="inline-flex items-center gap-1"><Landmark className="w-3 h-3" />{project.department}</span>
              </div>
            </div>
          </div>
          <button className="btn btn-primary w-max" onClick={() => setComposeOpen(true)}>
            <Send className="w-4 h-4" />
            Compose Message
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Thread list */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between dark:border-slate-800">
            <SectionTitle icon={MessagesSquare} title="Correspondence" className="mb-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{thread.length} letters</span>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto dark:divide-slate-800">
            {thread.map((m) => (
              <li key={m.id}>
                <button
                  className={cls('w-full text-left px-4 py-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60', selectedId === m.id && 'bg-blue-50/70 dark:bg-blue-950/30')}
                  onClick={() => setSelectedId(m.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      {m.status === 'Action Required' && <Circle className="w-2 h-2 fill-red-600 text-red-600 shrink-0" />}
                      <span className={cls('text-xs font-bold truncate', m.status === 'Action Required' ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200')}>
                        {m.subject}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">{timeAgo(m.ts)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={m.dir === 'in' ? m.status : 'Sent'} />
                    <span className="text-[10px] font-semibold text-slate-500 truncate dark:text-slate-400">{m.dir === 'in' ? m.from : 'To: ' + project.officer}</span>
                  </div>
                </button>
              </li>
            ))}
            {thread.length === 0 && (
              <li className="p-6">
                <EmptyState title="No correspondence yet" msg="Compose a message to the government officer for this project." />
              </li>
            )}
          </ul>
        </Card>

        {/* Message detail */}
        <div className="space-y-5">
          {selected ? (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Reference: {selected.ref}</p>
                    <h3 className="font-display font-bold text-lg text-slate-800 mt-1 dark:text-slate-100">{selected.subject}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1.5 dark:text-slate-400">
                      {selected.dir === 'in' ? 'From' : 'To'}: {selected.dir === 'in' ? `${selected.from} — ${selected.role}` : `${project.officer} (${project.department})`}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{fmtDateTime(selected.ts)} IST</p>
                  </div>
                  <StatusBadge status={selected.status === 'Sent' ? 'Submitted' : selected.status} />
                </div>
                <div className="border-t border-slate-100 mt-4 pt-4 dark:border-slate-800">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line dark:text-slate-300">{selected.body}</p>
                  {selected.attachments && selected.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selected.attachments.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-md px-2.5 py-1.5 dark:bg-slate-800 dark:text-slate-300">
                          <Paperclip className="w-3 h-3" />
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSubject(selected.subject.startsWith('Re:') ? selected.subject : `Re: ${selected.subject}`);
                      setBody(`Regarding ${selected.ref}: `);
                      setComposeOpen(true);
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Respond
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      toast('info', 'Marked as read', selected.ref);
                    }}
                  >
                    Mark as Read
                  </button>
                </div>
              </Card>

              {related.length > 1 && (
                <Card className="p-5">
                  <SectionTitle icon={MessagesSquare} title="Related Thread" />
                  <ol className="space-y-3">
                    {related
                      .slice()
                      .sort((a, b) => a.ts.localeCompare(b.ts))
                      .map((m) => (
                        <li key={m.id} className="border-l-2 border-slate-200 pl-3.5 dark:border-slate-700">
                          <p className="text-[11px] font-bold text-slate-500">{fmtDate(m.ts)} — {m.dir === 'in' ? 'Government' : 'Contractor'} ({m.ref})</p>
                          <p className="text-xs text-slate-700 mt-0.5 line-clamp-2 dark:text-slate-300">{m.body.slice(0, 160)}{m.body.length > 160 ? '…' : ''}</p>
                        </li>
                      ))}
                  </ol>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6">
              <EmptyState title="Select a message" msg="Choose a letter from the correspondence list, or compose a new message to the government officer." />
            </Card>
          )}

          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Communication Protocol</p>
            <ul className="text-xs text-slate-600 space-y-1.5 dark:text-slate-400">
              <li>• Quote the reference number in all follow-ups; responses are expected within 7 working days.</li>
              <li>• Notices marked “Action Required” carry contractual deadlines — respond before the due date.</li>
              <li>• Attach supporting documents (MB extracts, test reports) to reduce clarification cycles.</li>
              <li>• Formal submissions (EOT, rate claims) must additionally follow the contract's written-notice procedure.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        to={`${project.officer} — ${project.officerRole}`}
        subject={subject}
        setSubject={setSubject}
        type={type}
        setType={setType}
        body={body}
        setBody={setBody}
        files={files}
        setFiles={setFiles}
        onSend={send}
      />
    </div>
  );
}

function ComposeModal({
  open,
  onClose,
  to,
  subject,
  setSubject,
  type,
  setType,
  body,
  setBody,
  files,
  setFiles,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  to: string;
  subject: string;
  setSubject: (s: string) => void;
  type: string;
  setType: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  files: UploadDoc[];
  setFiles: (f: UploadDoc[]) => void;
  onSend: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose Message to Government"
      width="max-w-xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Discard
          </button>
          <button className="btn btn-primary" onClick={onSend}>
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="To">
          <input className="input bg-slate-100 dark:bg-slate-800/70" value={to} readOnly />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Communication Type">
            <Select value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Subject" required>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Request for wearing course specification clarification" />
          </Field>
        </div>
        <Field label="Message" required hint="Formal tone; quote reference numbers where applicable">
          <textarea className="input min-h-[140px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Respected Sir/Madam, …" />
        </Field>
        <DocumentUploader label="Attach Documents" docs={files} onChange={setFiles} />
      </div>
    </Modal>
  );
}
