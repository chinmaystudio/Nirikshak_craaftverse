import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, RotateCcw, Users, Wallet, CalendarClock, Target, Gauge, TrendingUp } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Spinner, AIRecommendation } from '../../components/ui';
import { Link } from '../../lib/router';
import type { Project } from '../../lib/data';
import { cr, fmtDate } from '../../lib/utils';

interface Msg {
  role: 'user' | 'ai';
  text?: string;
  answer?: GuideAnswer;
}

interface GuideAnswer {
  title: string;
  recommendation?: { intro: string; actions: { label: string; impact?: string }[]; recovery?: string };
  text?: string;
  list?: { label: string; value?: string }[];
}

const QUESTIONS = [
  'How can I complete this milestone faster?',
  'Why is my project delayed?',
  'How can I reduce project cost?',
  'Which resources should I increase?',
  'What should I prioritize this week?',
];

export default function AIGuide({ project }: { project: Project }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const current = project.milestones.find((m) => m.state === 'current');
  const pendingAmount = project.received < project.spent ? project.spent - project.received : 0;

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, thinking]);

  const answerFor = (q: string): GuideAnswer => {
    const l = q.toLowerCase();
    const rec = project.forecast.actions.map((a) => ({ label: a.label, impact: a.impact }));
    const behind = project.planned - project.progress;

    if (l.includes('faster') || l.includes('milestone')) {
      return {
        title: `Accelerating “${current?.name ?? 'next milestone'}”`,
        recommendation: {
          intro: `“${current?.name ?? 'Structural work'}” is at ${current?.progress ?? project.progress}% with ${Math.max(0, Math.round(project.progress / 4))} working weeks of scope remaining. Based on current productivity (${Math.round(project.forecast.factors[2]?.value ?? 80)}/100) and resource availability, the following sequence recovers the most time:`,
          actions: rec,
          recovery: `Potential recovery: ${Math.abs(project.forecast.earlyDays)} days ${project.forecast.earlyDays >= 0 ? 'earlier than deadline' : 'of the projected delay'}.`,
        },
      };
    }
    if (l.includes('delay')) {
      return {
        title: 'Delay diagnosis',
        text: `${project.name} is ${behind > 0 ? `${behind}% behind` : 'ahead of'} planned progress. Primary contributors from site data:`,
        list: [
          { label: 'Schedule score', value: `${project.health.scores.find((s) => s.label === 'Schedule')?.value ?? '—'}/100` },
          { label: 'Last update', value: `${fmtDate(project.lastUpdate)} — ${project.lastUpdateNote}` },
          { label: 'Resource availability', value: `${project.forecast.factors[1]?.detail ?? 'monitor crew strength'}` },
        ],
      };
    }
    if (l.includes('cost') || l.includes('budget')) {
      return {
        title: 'Cost reduction opportunities',
        text: 'Budget adherence is strong. Based on the expenditure mix, the biggest levers are:',
        list: [
          { label: 'Materials', value: `₹ ${project.expenses[0].spent.toFixed(2)} Cr spent of ₹ ${project.expenses[0].budget.toFixed(2)} Cr — negotiate bulk rates before the final procurement cycle` },
          { label: 'Equipment idle time', value: 'Return idle plant (survey equipment, hoists) to reduce monthly hire charges' },
          { label: 'Re-work avoidance', value: 'Maintain layer-testing frequency — every rejected layer costs 3–4 days plus material' },
        ],
      };
    }
    if (l.includes('resource') || l.includes('increase')) {
      return {
        title: 'Resource recommendations',
        text: 'AI compares crew strength against remaining scope per zone:',
        list: [
          { label: 'Structural workforce', value: 'Increase 8–10% — directly improves weekly progress' },
          { label: 'Equipment', value: 'Reallocate one roller/paver crew to the weakest zone' },
          { label: 'Materials', value: 'Lock procurement for low-stock items 7 days before requirement' },
        ],
      };
    }
    if (l.includes('prioritize') || l.includes('week')) {
      return {
        title: 'This week’s priorities',
        recommendation: {
          intro: 'Ranked by impact on completion and compliance for the current week:',
          actions: [
            { label: current ? `Close out ${current.name} critical path items` : 'Start the next milestone mobilization', impact: 'highest' },
            { label: 'Follow up pending verification of the latest RA bill', impact: 'cash flow' },
            { label: 'Clear compliance calendar items (insurance / tests) this week', impact: 'risk' },
            { label: 'Update progress report with site photos for officer review', impact: 'visibility' },
          ],
        },
      };
    }
    return {
      title: 'Project snapshot',
      text: `${project.name} is ${project.progress}% complete (${project.status}, ${project.risk} risk) with contract value ${cr(project.value)}. Health score is ${project.health.score}/100 (${project.health.overall}). Ask me about milestones, delays, costs, resources or this week's priorities.`,
    };
  };

  const ask = (q: string) => {
    if (!q.trim() || thinking) return;
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setThinking(true);
    window.setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', answer: answerFor(q) }]);
      setThinking(false);
    }, 850);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 dark:bg-blue-950 dark:border-blue-800">
            <Sparkles className="w-4.5 h-4.5 text-blue-700 w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">NIRIKSHAK AI Guide</h2>
            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
              Project-aware guidance for {project.name} — progress, budget, resources, timeline, inspections &amp; compliance
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <CtxChip icon={Gauge} label={`${project.progress}% complete`} />
          <CtxChip icon={Wallet} label={`${cr(project.value)} contract`} />
          <CtxChip icon={Users} label="resources tracked" />
          <CtxChip icon={CalendarClock} label={`deadline ${fmtDate(project.deadline)}`} />
          <CtxChip icon={TrendingUp} label={`health ${project.health.score}/100`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle icon={Target} title="Project Context" />
            <dl className="space-y-3">
              <CtxRow k="Current milestone" v={current?.name ?? '—'} />
              <CtxRow k="Milestone progress" v={current?.progress ? `${current.progress}%` : '—'} />
              <CtxRow k="Planned vs actual" v={`${project.planned}% / ${project.progress}%`} />
              <CtxRow k="Spent" v={`₹ ${project.spent.toFixed(2)} Cr`} />
              <CtxRow k="Open risks" v={`${project.health.risks.length}`} />
              <CtxRow k="Compliance" v={`${project.complianceScore}%`} />
            </dl>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Sparkles} title="Example Questions" />
            <div className="flex flex-col gap-2">
              {QUESTIONS.map((qq) => (
                <button
                  key={qq}
                  className="text-left text-[13px] font-semibold text-slate-700 rounded-lg border border-slate-200 px-3 py-2.5 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950/30"
                  onClick={() => ask(qq)}
                >
                  {qq}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col min-h-[560px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Guidance Thread</p>
            {msgs.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setMsgs([])}>
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {msgs.length === 0 && !thinking && (
              <div className="text-center pt-10 max-w-md mx-auto">
                <Sparkles className="w-8 h-8 text-blue-300 mx-auto mb-3 dark:text-blue-700" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Ask a question about this project</p>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed dark:text-slate-400">
                  The guide reads live project data — progress, bills, inspections, resource registers — and answers with
                  specific, actionable recommendations.
                </p>
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg rounded-br-sm bg-blue-700 text-white px-4 py-2.5 text-sm font-medium shadow-sm">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="rounded-lg border border-blue-200 bg-white overflow-hidden dark:border-blue-900 dark:bg-slate-900">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 dark:bg-blue-950/40 dark:border-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">{m.answer!.title}</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {m.answer!.recommendation ? (
                      <AIRecommendation
                        intro={m.answer!.recommendation.intro}
                        actions={m.answer!.recommendation.actions}
                        recovery={m.answer!.recommendation.recovery}
                        footer="AI estimate — verify with site conditions before committing resources."
                      />
                    ) : (
                      <>
                        {m.answer!.text && <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{m.answer!.text}</p>}
                        {m.answer!.list && (
                          <ul className="space-y-2.5">
                            {m.answer!.list.map((li) => (
                              <li key={li.label} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{li.label}</p>
                                {li.value && <p className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">{li.value}</p>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            )}
            {thinking && (
              <div className="flex items-center gap-2 text-slate-500">
                <Spinner className="text-blue-700 dark:text-blue-400" />
                <span className="text-xs font-semibold">Reading project data…</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex gap-2.5">
              <input
                className="input flex-1"
                placeholder="Ask about this project…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask(input)}
                aria-label="Ask the AI guide"
              />
              <button className="btn btn-primary" onClick={() => ask(input)} disabled={!input.trim() || thinking} aria-label="Send">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Guidance is AI-generated from project data — cross-check critical actions with site records.</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2.5 justify-center">
        <Link to={`/projects/${project.id}/ai-analysis`} className="btn btn-secondary btn-sm">Deep AI Project Analysis</Link>
        <Link to={`/projects/${project.id}/ai-completion`} className="btn btn-secondary btn-sm">Completion Prediction</Link>
        <StatusBadge status="AI Tools" />
      </div>
    </div>
  );
}

function CtxChip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <Icon className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
      {label}
    </span>
  );
}

function CtxRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-xs text-slate-500 font-semibold">{k}</dt>
      <dd className="text-xs font-bold text-slate-800 text-right dark:text-slate-200">{v}</dd>
    </div>
  );
}
