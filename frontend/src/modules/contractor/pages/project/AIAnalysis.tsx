import { useEffect, useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Loading } from '../../components/ui';
import { Link } from '../../lib/router';
import { ProgressRing, HBars } from '../../components/charts';
import type { Project } from '../../lib/data';
import { contractorAiService, ContractorAiAnalysis } from '../../services/ai.service';

export default function AIAnalysis({ project }: { project: Project }) {
  const [loading, setLoading] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<ContractorAiAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await contractorAiService.analyzeAssignedProject(project.id);
      setLiveAnalysis(result);
    } catch (err: any) {
      console.warn('[AIAnalysis] Live AI analysis error:', err);
      setErrorMsg(err.message || 'AI service temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const health = project.health;
  const overallColor =
    health?.overall === 'GOOD' ? 'var(--ch-green)' : health?.overall === 'FAIR' ? 'var(--ch-amber)' : 'var(--ch-red)';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <Activity className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">AI Project Intelligence — {project.name}</h3>
        </div>
        <button className="btn btn-primary btn-sm w-max" onClick={runAnalysis} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running AI Engine…' : 'Run Live AI Analysis'}
        </button>
      </div>

      {loading && (
        <Card className="p-6">
          <Loading label="Consulting ML isolation forest, online drift model, and LinUCB recommendations…" />
        </Card>
      )}

      {errorMsg && (
        <Card className="p-4 border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>AI Service Notice:</span>
          </div>
          <p className="mt-1">{errorMsg}</p>
        </Card>
      )}

      {/* Live AI Analysis Results if available */}
      {liveAnalysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Review Priority</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {liveAnalysis.historical_analysis.review_priority_score}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mt-1">
                Band: {liveAnalysis.historical_analysis.review_band}
              </span>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Structural Anomaly</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {liveAnalysis.historical_analysis.structural_anomaly_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">IsolationForest Baseline</span>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Cost Anomaly</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {liveAnalysis.historical_analysis.cost_anomaly_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Robust Sector Cohort</span>
            </Card>

            <Card className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Operational Drift</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {liveAnalysis.operational_drift.available
                  ? `${liveAnalysis.operational_drift.drift_percentile ?? 0}%`
                  : 'Baseline'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Online MiniBatch Model</span>
            </Card>
          </div>

          {/* LLM Narrative Summary */}
          {liveAnalysis.llm?.summary && (
            <Card className="p-5 border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-2 text-blue-900 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-sm font-bold">Executive AI Summary ({liveAnalysis.llm.provider})</h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {liveAnalysis.llm.summary}
              </p>
            </Card>
          )}

          {/* Recommended actions from LinUCB */}
          {liveAnalysis.recommended_actions.length > 0 && (
            <Card className="p-5">
              <SectionTitle icon={Cpu} title="Contextual Bandit Advisory Actions" />
              <div className="space-y-2 mt-3">
                {liveAnalysis.recommended_actions.map((act) => (
                  <div
                    key={act.action}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{act.action}</span>
                      {act.reason && <p className="text-slate-500 mt-0.5">{act.reason}</p>}
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Score: {act.score.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="p-3 rounded border border-slate-200 bg-slate-50 dark:bg-slate-900 text-center">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {liveAnalysis.decision_guardrail}
            </span>
          </div>
        </div>
      )}

      {/* If neither live analysis nor static health exists */}
      {!loading && !liveAnalysis && !health && (
        <Card className="p-8 text-center space-y-3">
          <Cpu className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">AI Analysis Not Yet Available</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This project has not yet been processed by the NIRIKSHAK ML engine. Risk and health metrics are not fabricated and require verified register records.
          </p>
          <button className="btn btn-primary btn-sm" onClick={runAnalysis}>
            <Sparkles className="w-3.5 h-3.5" />
            Compute AI Anomaly & Health Analysis
          </button>
        </Card>
      )}

      {/* Legacy health panel if available (e.g. from demo fixture) */}
      {!liveAnalysis && health && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3">Overall Health</p>
              <ProgressRing
                value={health.score}
                size={140}
                color={overallColor}
                label={health.overall}
                sub={`${health.score}/100`}
              />
              <p className="text-xs text-slate-500 mt-4 font-medium dark:text-slate-400">
                Composite of progress, schedule, budget, resources and compliance indicators.
              </p>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <SectionTitle icon={Activity} title="Dimension Scores" />
              <HBars
                items={health.scores.map((s) => ({
                  label: s.label,
                  value: s.value,
                  color: s.value >= 75 ? 'bg-green-600' : s.value >= 55 ? 'bg-amber-500' : 'bg-red-600',
                }))}
              />
              <div className="flex flex-wrap gap-2 mt-5">
                {health.risks.map((r) => (
                  <StatusBadge key={r.area} status={r.level} />
                ))}
              </div>
            </Card>
          </div>

          {health.risks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No active risks detected</p>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">This project is closed and all dimensions are nominal.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {health.risks.map((r) => (
                <Card key={r.area} className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {r.level === 'High' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : r.level === 'Medium' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{r.area}</h4>
                    </div>
                    <StatusBadge status={r.level} />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{r.explanation}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap justify-center gap-2.5">
        <Link to={`/projects/${project.id}/ai-completion`} className="btn btn-secondary btn-sm">
          AI Completion Prediction
        </Link>
        <Link to={`/projects/${project.id}/ai-guide`} className="btn btn-secondary btn-sm">
          Ask AI Guide
        </Link>
      </div>

      <p className="text-[11px] text-slate-400 text-center">
        AI intelligence is advisory only and assists human oversight. It does not make legal, contractual, or financial decisions.
      </p>
    </div>
  );
}
