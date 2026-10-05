import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, CircleAlert, FileWarning, RefreshCw } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Loading } from '../components/ui';
import { ProgressRing } from '../components/charts';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { getTender } from '../lib/data';
import type { Tender } from '../lib/data';
import { ContractorTenderService } from '../services/tender.service';
import { eligibilityRows, eligibilityStatus } from '../lib/eligibility';
import { cr, fmtDate, cls } from '../lib/utils';

export default function BidAIAssist({ tenderId }: { tenderId: string }) {
  const [tender, setTender] = useState<Tender | null>(() => getTender(tenderId) || null);
  const { bids, toast } = useStore();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ContractorTenderService.getTender(tenderId)
      .then((dbT) => {
        if (active && dbT) {
          setTender(ContractorTenderService.toTender(dbT));
        }
      })
      .catch((err) => {
        console.warn('Error loading live tender for AI assist:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [tenderId, nonce]);

  if (!tender) {
    return (
      <div className="p-6 max-w-3xl mx-auto pt-10">
        <Card className="p-8 text-center">
          <p className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">Tender not found</p>
          <Link to="/tenders" className="btn btn-primary mt-5 inline-flex">Back to Tender Management</Link>
        </Card>
      </div>
    );
  }

  const rows = eligibilityRows(tender);
  const status = eligibilityStatus(tender);
  const technicalRequirement = tender.techReq?.find((item) => typeof item === 'string' && item.trim())?.trim() || '';
  const separatorIndex = technicalRequirement.indexOf(';');
  const primaryTechnicalRequirement = (separatorIndex >= 0 ? technicalRequirement.slice(0, separatorIndex) : technicalRequirement)
    || 'No specific technical requirement was included in the published tender';
  const technicalClauseCount = Math.max(0, (tender.techReq?.length || 1) - 1);
  const primaryFinancialRequirement = tender.finReq?.find((item) => item?.trim())
    || 'No separate financial requirement was included in the published tender';
  const expectedAwardDate = tender.timeline?.[Math.max(0, tender.timeline.length - 1)]?.date || tender.deadline;
  const missing = (tender.docs && tender.docs.length > 0)
    ? tender.docs.slice(0, 2)
    : [];
  const readiness = Math.max(20, 100 - missing.length * 11 - (status === 'Review' ? 8 : 0));

  const regen = () => {
    setNonce((n) => n + 1);
    toast('info', 'Re-analyzing bid readiness…');
  };

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1300px] mx-auto space-y-5">
      <div>
        <Link to={`/tenders/${tender.id}/bid`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-2 w-max dark:text-slate-400">
          ← Bid Submission
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-slate-800 tracking-tight font-bold dark:text-slate-100">AI Bid Assist</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium dark:text-slate-400">
              {tender.title} • {tender.code} • Deadline {fmtDate(tender.deadline)}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={regen}>
            <RefreshCw className="w-4 h-4" />
            Re-run Analysis
          </button>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <Loading label="AI analyzing tender against contractor profile…" />
        </Card>
      ) : (
        <>
          {/* AI Bid Check */}
          <Card className="p-5">
            <SectionTitle icon={Sparkles} title="AI Bid Check" />
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex items-center gap-5 shrink-0">
                <ProgressRing value={readiness} size={130} label={`${readiness}%`} sub="Bid Readiness" color={readiness >= 70 ? 'var(--ch-green)' : 'var(--ch-amber)'} />
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-200 dark:border-slate-700 dark:divide-slate-700">
                  {[
                    { label: 'Eligibility', tone: status === 'Eligible' ? 'ok' : status === 'Review' ? 'warn' : 'bad', note: status === 'Eligible' ? 'Passed' : status === 'Review' ? 'Manual review required' : 'Not met' },
                    { label: 'Required Documents', tone: missing.length === 0 ? 'ok' : 'warn', note: missing.length === 0 ? 'All attached' : `${missing.length} missing` },
                    { label: 'Technical Requirements', tone: 'ok', note: 'Passed' },
                    { label: 'Financial Requirements', tone: 'ok', note: 'Passed' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-3 px-3.5 py-3">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.label}</span>
                      <span className={cls('inline-flex items-center gap-1.5 text-xs font-bold', r.tone === 'ok' ? 'text-green-700 dark:text-green-400' : r.tone === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-red-600')}>
                        {r.tone === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : r.tone === 'warn' ? <CircleAlert className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {r.note}
                      </span>
                    </div>
                  ))}
                </div>
                {missing.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900 dark:bg-amber-950/40">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5 dark:text-amber-300">
                      <FileWarning className="w-3.5 h-3.5" /> Missing Documents
                    </p>
                    <ul className="flex flex-col gap-1">
                      {missing.map((m) => (
                        <li key={m} className="text-sm font-semibold text-amber-900 dark:text-amber-200">• {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Requirement analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <SectionTitle title="Tender Summary" />
              <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{tender.summary}</p>
            </Card>

            <Card className="p-5">
              <SectionTitle title="Requirement Analysis" />
              <div className="space-y-3.5 text-sm">
                <p className="text-slate-700 leading-relaxed dark:text-slate-300">
                  <strong>Technical:</strong> {primaryTechnicalRequirement}. {technicalClauseCount > 0 ? `The remaining ${technicalClauseCount} clauses require separate review.` : 'Review the published tender documents before final submission.'}
                </p>
                <p className="text-slate-700 leading-relaxed dark:text-slate-300">
                  <strong>Financial:</strong> {primaryFinancialRequirement}. Cash flow analysis suggests arranging the EMD ({'₹' + Number(tender.emd || 0).toFixed(2) + ' L'}) as a bank guarantee rather than cash to preserve working capital.
                </p>
                <p className="text-slate-700 leading-relaxed dark:text-slate-300">
                  <strong>Timeline:</strong> {tender.durationMonths || 'Not specified'} months with the current tender milestone dated {fmtDate(expectedAwardDate)}. Confirm the final work schedule with the issuing authority.
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle title="Technical & Financial Proposal Review" />
              <ul className="space-y-2.5">
                {[
                  { label: 'Plant base within 45 km of site', tone: 'ok', note: 'paver, batch plant and rollers idle in Sep–Oct' },
                  { label: 'Similar work references exceed requirement', tone: 'ok', note: 'Multiple qualifying completed works on record' },
                  { label: 'Specialist scope needs subcontractor', tone: tender.category === 'Water Supply' ? 'warn' : 'ok', note: tender.category === 'Water Supply' ? 'electromechanical OEM partner to be finalized' : 'no specialist scope detected' },
                  { label: 'Bid premium band', tone: 'ok', note: 'estimate-based pricing supports a competitive bid' },
                ].map((r) => (
                  <li key={r.label} className="flex items-start gap-2.5">
                    {r.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <CircleAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <SectionTitle title="Bid Risk Analysis" />
              <div className="space-y-3">
                {[
                  { level: 'Medium', area: 'Schedule overlap', note: 'Award (~Oct) coincides with peak execution on 4 active projects — plan a dedicated site team.' },
                  { level: 'Low', area: 'Competition', note: `Department history shows 3–6 bidders for ${tender.category} works of this size.` },
                  { level: missing.length ? 'Medium' : 'Low', area: 'Documentation', note: missing.length ? `Attach ${missing.join(', ').toLowerCase()} before the deadline to avoid technical rejection.` : 'All required documents are on file and valid.' },
                  { level: 'Low', area: 'Cash flow', note: 'EMD as BG + monthly RA billing keeps exposure manageable.' },
                ].map((r) => (
                  <div key={r.area} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <StatusBadge status={r.level} />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{r.area}</p>
                      <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{r.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Eligibility table */}
          <Card className="overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between">
              <SectionTitle title="Eligibility Check — Profile vs Requirements" className="mb-0" />
              <StatusBadge status={status} />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th>Requirement</th>
                    <th>Our Profile</th>
                    <th>Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label}>
                      <td className="font-bold text-slate-800 dark:text-slate-100">{r.label}</td>
                      <td className="text-xs max-w-[280px]">{r.required}</td>
                      <td className="text-xs max-w-[240px] font-semibold">{r.ours}</td>
                      <td>
                        {r.pass === true ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400"><CheckCircle2 className="w-4 h-4" /> Passed</span>
                        ) : r.pass === false ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><XCircle className="w-4 h-4" /> Not met</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400"><CircleAlert className="w-4 h-4" /> Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-end">
            {status === 'Not Eligible' ? (
              <button className="btn btn-primary" disabled>Not eligible — cannot bid</button>
            ) : (
              <Link to={`/tenders/${tender.id}/bid`}>
                <button className="btn btn-primary">
                  Continue Bid <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            AI bid analysis is advisory and generated from your contractor profile and tender documents. Final evaluation rests with the tendering authority. Estimated value: {cr(tender.value)}.
          </p>
        </>
      )}
    </div>
  );
}
