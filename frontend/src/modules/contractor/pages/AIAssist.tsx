import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, RotateCcw, ShieldCheck, Banknote, Map, Gavel, AlertTriangle } from 'lucide-react';
import { PageHeader, Card, SectionTitle, StatusBadge, Spinner } from '../components/ui';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { AI_ANSWERS, CONTRACTOR, pendingForProject } from '../lib/data';
import { cls, cr, money } from '../lib/utils';

interface Msg {
  role: 'user' | 'ai';
  text?: string;
  answer?: (typeof AI_ANSWERS)[number];
}

const SUGGESTIONS = [
  { icon: AlertTriangle, q: 'Which of my projects are at risk?' },
  { icon: Banknote, q: 'Which payment is pending?' },
  { icon: Sparkles, q: 'What should I do to finish Pune Road earlier?' },
  { icon: Gavel, q: 'Which tender am I eligible for?' },
  { icon: ShieldCheck, q: 'What documents are missing from my bid?' },
  { icon: Map, q: 'Why is Rural Bridge Construction delayed?' },
];

export default function AIAssist() {
  const { projects, invoices, bids } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const active = projects.filter((p) => p.status !== 'Completed');
  const pendingAmt = invoices.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).reduce((s, i) => s + i.amount, 0);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, thinking]);

  const resolve = (question: string) => {
    const q = question.toLowerCase();
    const found = AI_ANSWERS.find((a) => a.match.some((m) => q.includes(m)));
    if (found) return found;
    return {
      match: [],
      title: 'Contractor status summary',
      blocks: [
        {
          kind: 'text' as const,
          text: `Here is your current standing: ${active.length} active works (${cr(active.reduce((s, p) => s + p.value, 0))}), ${money(pendingAmt)} in bills awaiting release, and 2 open tender deadlines within 30 days. Ask me about a specific project, payment, tender or compliance item for a deeper answer.`,
        },
        {
          kind: 'list' as const,
          items: [
            { label: 'At-risk projects', value: 'Rural Bridge (HIGH), Hospital (MEDIUM)' },
            { label: 'Next inspection', value: '15 Sep — Pune Road, Structural Zone 1' },
            { label: 'Nearest tender deadline', value: '28 Sep — NH-548C Satara (readiness 78%)' },
          ],
        },
      ],
    };
  };

  const ask = (question: string) => {
    if (!question.trim() || thinking) return;
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setThinking(true);
    window.setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', answer: resolve(question) }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="AI Assist"
        subtitle="NIRIKSHAK AI Assistant with contractor context — projects, payments, tenders, compliance and performance"
        actions={
          <button className="btn btn-secondary" onClick={() => setMsgs([])} disabled={msgs.length === 0}>
            <RotateCcw className="w-4 h-4" />
            Clear Conversation
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Context panel */}
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle icon={Map} title="Contractor Context" />
            <div className="flex flex-col gap-3">
              {active.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate dark:text-slate-200">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{p.deptAbbr} • {p.progress}% • {cr(p.value)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Pending</p>
                <p className="text-sm font-display font-bold text-amber-700 dark:text-amber-400">{money(pendingAmt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Open Bids</p>
                <p className="text-sm font-display font-bold text-blue-800 dark:text-blue-300">{Object.values(bids).filter((b) => ['Draft', 'Submitted'].includes(b.status)).length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Sparkles} title="Suggested Prompts" />
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.q}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950/30"
                  onClick={() => ask(s.q)}
                >
                  <s.icon className="w-4 h-4 text-blue-700 shrink-0 dark:text-blue-400" />
                  {s.q}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Conversation */}
        <Card className="flex flex-col h-[calc(100vh-13rem)] min-h-[520px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center dark:bg-blue-950 dark:border-blue-800">
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">NIRIKSHAK AI Assistant</p>
                <p className="text-[10px] font-semibold text-green-700 dark:text-green-400">● Contractor context loaded — {CONTRACTOR.short}</p>
              </div>
            </div>
          </div>

          <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {msgs.length === 0 && !thinking && (
              <div className="max-w-xl mx-auto text-center pt-10">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 dark:bg-blue-950 dark:border-blue-800">
                  <Sparkles className="w-7 h-7 text-blue-700 dark:text-blue-400" />
                </div>
                <p className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">Ask about your portfolio</p>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed dark:text-slate-400">
                  I can analyze your project health, payments, tender eligibility, compliance and delays using live portal data.
                  Try a suggested prompt or type your own question.
                </p>
              </div>
            )}

            {msgs.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-blue-700 text-white px-4 py-2.5 text-sm font-medium shadow-sm">
                    {m.text}
                  </div>
                </div>
              ) : (
                <AIAnswerCard key={i} answer={m.answer!} />
              )
            )}

            {thinking && (
              <div className="flex items-center gap-2 text-slate-500">
                <Spinner className="text-blue-700 dark:text-blue-400" />
                <span className="text-xs font-semibold">Analyzing contractor data…</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex gap-2.5">
              <input
                className="input flex-1"
                placeholder="Ask about projects, payments, tenders, compliance…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask(input)}
                aria-label="Ask the AI assistant"
              />
              <button className="btn btn-primary" onClick={() => ask(input)} disabled={!input.trim() || thinking} aria-label="Send question">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              AI answers are generated from your portal data and are advisory. Verify with official records before submissions.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AIAnswerCard({ answer }: { answer: (typeof AI_ANSWERS)[number] }) {
  return (
    <div className="max-w-[92%]">
      <div className="rounded-lg border border-blue-200 bg-white overflow-hidden dark:border-blue-900 dark:bg-slate-900">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 dark:bg-blue-950/40 dark:border-blue-900">
          <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">{answer.title}</span>
        </div>
        <div className="p-4 space-y-3.5">
          {answer.blocks.map((b, bi) => {
            if (b.kind === 'text') {
              return (
                <p key={bi} className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">
                  {b.text}
                </p>
              );
            }
            if (b.kind === 'list') {
              return (
                <ul key={bi} className="flex flex-col gap-2.5">
                  {b.items?.map((it) => {
                    const body = (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 w-full">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {it.link ? <span className="link">{it.label}</span> : it.label}
                        </span>
                        <span
                          className={cls(
                            'text-xs font-semibold sm:text-right sm:max-w-[55%]',
                            it.tone === 'bad' ? 'text-red-600' : it.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : it.tone === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-300'
                          )}
                        >
                          {it.value}
                        </span>
                      </div>
                    );
                    return (
                      <li key={it.label} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                        {it.link ? <Link to={it.link} className="block w-full">{body}</Link> : body}
                      </li>
                    );
                  })}
                </ul>
              );
            }
            if (b.kind === 'actions') {
              return (
                <div key={bi} className="flex flex-wrap gap-2 pt-1">
                  {b.items?.map((a) => (
                    <Link key={a.label} to={a.link!} className="btn btn-secondary btn-sm">
                      {a.label}
                    </Link>
                  ))}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5">AI-generated from portal data • verify before acting</p>
    </div>
  );
}
