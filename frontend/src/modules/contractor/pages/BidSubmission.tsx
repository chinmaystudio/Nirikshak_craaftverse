import { useEffect, useMemo, useState } from 'react';
import {
  Check, ArrowLeft, ArrowRight, Save, Sparkles, CircleAlert, Building2, ShieldCheck,
  Wrench, IndianRupee, FileUp, ClipboardList, Send, CheckCircle2,
} from 'lucide-react';
import { Card, StatusBadge, Field, DocumentUploader, ConfirmModal, SectionTitle } from '../components/ui';
import { Link } from '../lib/router';
import type { UploadDoc } from '../components/ui';
import { useStore } from '../lib/store';
import { getTender, CONTRACTOR, BID_STEPS } from '../lib/data';
import { eligibilityStatus } from '../lib/eligibility';
import { cr, money, fmtDate, cls } from '../lib/utils';
import { ContractorTenderService } from '../services/tender.service';

interface BidData {
  contact: string;
  signatory: string;
  designation: string;
  turnoverFY: string;
  eligibilityDecls: boolean[];
  methodology: string;
  equipment: string;
  safetyPlan: boolean;
  bidAmount: string;
  taxPercent: string;
  validity: string;
  docs: UploadDoc[];
  verified: boolean;
}

const EMPTY: BidData = {
  contact: CONTRACTOR.name,
  signatory: '',
  designation: 'Authorized Signatory',
  turnoverFY: '',
  eligibilityDecls: [false, false, false, false],
  methodology: '',
  equipment: '',
  safetyPlan: false,
  bidAmount: '',
  taxPercent: '18',
  validity: '120',
  docs: [],
  verified: false,
};

const REQUIRED_DOCS = ['Experience Certificate', 'Equipment Ownership Proof', 'EMD Bank Guarantee', 'Turnover Certificate'];

export default function BidSubmission({ tenderId }: { tenderId: string }) {
  const tender = getTender(tenderId);
  const { bids, saveBidDraft, submitBid, toast } = useStore();
  const existing = tender ? bids[tender.id] : undefined;
  const [step, setStep] = useState(existing && existing.status === 'Draft' ? Math.min(existing.step, 6) : 0);
  const [data, setData] = useState<BidData>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(existing && existing.ref ? existing.ref : null);
  const [serverSubmittedAt, setServerSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadServerBid = async () => {
      try {
        const serverBids = await ContractorTenderService.getMyBids();
        const serverBid = serverBids.find((bid) => bid.tender_id === tenderId && bid.status === 'SUBMITTED');
        if (active && serverBid?.bid_reference) {
          setSubmittedRef(serverBid.bid_reference);
          setServerSubmittedAt(serverBid.submitted_at || null);
        }
      } catch (error) {
        console.warn('Unable to restore submitted bid state:', error);
      }
    };
    void loadServerBid();
    return () => { active = false; };
  }, [tenderId]);

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

  if (submittedRef || existing?.status === 'Submitted') {
    const ref = submittedRef ?? existing?.ref!;
    return (
      <div className="p-4 lg:p-6 lg:py-8 max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4 dark:bg-green-950/60 dark:border-green-900">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100">Bid Submitted</p>
          <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">
            Your bid for <strong className="text-slate-700 dark:text-slate-300">{tender.title}</strong> has been submitted to {tender.department}.
          </p>
          <div className="rounded-lg border border-slate-200 p-4 mt-6 text-left dark:border-slate-700">
            <dl className="space-y-2 text-sm">
              <Row k="Bid Reference" v={ref} mono />
              <Row k="Submitted On" v={fmtDate(serverSubmittedAt ?? existing?.submittedAt ?? new Date().toISOString())} />
              <Row k="Department" v={tender.department} />
              <Row k="Current Stage" v="Technical Bid Opening" />
            </dl>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            <Link to="/tenders">
              <button className="btn btn-secondary">My Bids</button>
            </Link>
            <Link to={`/tenders/${tender.id}`}>
              <button className="btn btn-primary">View Tender</button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const set = (k: keyof BidData, v: unknown) => setData((d) => ({ ...d, [k]: v }));
  const err = (k: keyof BidData, msg: string) => (touched[k] ? msg : undefined);
  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const amountNum = Number(data.bidAmount) || 0;
  const overEstimate = amountNum > 0 && amountNum > tender.value * 1.1;

  const stepValid = (s: number): boolean => {
    switch (s) {
      case 0: return data.signatory.trim().length > 2 && data.designation.trim().length > 2 && data.turnoverFY.trim().length > 0;
      case 1: return data.eligibilityDecls.every(Boolean);
      case 2: return data.methodology.trim().length >= 80 && data.equipment.trim().length >= 10 && data.safetyPlan;
      case 3: return amountNum > 0 && !overEstimate && Number(data.taxPercent) > 0;
      case 4: return missingDocs.length === 0;
      case 5: return data.verified;
      default: return false;
    }
  };

  const missingDocs = useMemo(() => {
    const names = data.docs.map((d) => d.name.toLowerCase());
    const keys = REQUIRED_DOCS.map((r) => r.toLowerCase().split(' ')[0]); // experience, equipment, emd, turnover
    return REQUIRED_DOCS.filter((_, i) => !names.some((n) => n.includes(keys[i])));
  }, [data.docs]);

  const saveDraft = (silent?: boolean) => {
    saveBidDraft(tender.id, step, data as unknown as Record<string, unknown>);
    if (amountNum > 0) {
      void ContractorTenderService.saveDraft({
        tenderId: tender.id,
        bidAmount: amountNum,
        technicalProposal: data.methodology,
      }).catch((error) => {
        console.error('Unable to save bid draft:', error);
        if (!silent) toast('warn', 'Database draft not saved', error.message || 'Please retry.');
      });
    }
    if (!silent) toast('success', 'Draft saved', `Bid for ${tender.code} saved. Continue anytime from My Bids.`);
  };

  const doSubmit = async () => {
    try {
      const bid = await ContractorTenderService.submitBid({
        tenderId: tender.id,
        bidAmount: amountNum,
        technicalProposal: data.methodology,
      });
      submitBid(tender.id, amountNum, bid.bid_reference);
      setSubmittedRef(bid.bid_reference);
      setConfirmOpen(false);
      toast('success', 'Bid submitted successfully', `Reference: ${bid.bid_reference}`);
    } catch (error: any) {
      if ((error?.message || '').toLowerCase().includes('only draft bids can be changed')) {
        try {
          const serverBids = await ContractorTenderService.getMyBids();
          const serverBid = serverBids.find((bid) => bid.tender_id === tender.id && bid.status === 'SUBMITTED');
          if (serverBid?.bid_reference) {
            submitBid(tender.id, amountNum, serverBid.bid_reference);
            setSubmittedRef(serverBid.bid_reference);
            setServerSubmittedAt(serverBid.submitted_at || null);
            setConfirmOpen(false);
            toast('success', 'Bid already submitted', `Reference: ${serverBid.bid_reference}`);
            return;
          }
        } catch (recoveryError) {
          console.warn('Unable to recover submitted bid state:', recoveryError);
        }
      }
      toast('warn', 'Bid submission failed', error.message || 'Please retry.');
    }
  };

  const go = (s: number) => {
    if (s > step && !stepValid(step)) {
      setTouched((t) => ({ ...t, signatory: true, turnoverFY: true, methodology: true, equipment: true, bidAmount: true }));
      toast('warn', 'Complete this step', 'Fix the highlighted fields before continuing.');
      return;
    }
    saveDraft(true);
    setStep(s);
  };

  const STEP_ICONS = [Building2, ShieldCheck, Wrench, IndianRupee, FileUp, ClipboardList, Send];

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1300px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link to={`/tenders/${tender.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-2 w-max dark:text-slate-400">
          ← Tender Details
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-slate-800 tracking-tight font-bold dark:text-slate-100">Bid Submission</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium dark:text-slate-400">
              {tender.title} • {tender.code} • {tender.department} • Deadline {fmtDate(tender.deadline)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status="Draft" />
            <Link to={`/tenders/${tender.id}/bid/ai-assist`}>
              <button className="btn btn-secondary">
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                AI Bid Assist
              </button>
            </Link>
            <button className="btn btn-secondary" onClick={() => saveDraft()}>
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Card className="px-5 py-4">
        <ol className="flex items-center overflow-x-auto gap-0">
          {BID_STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'pending';
            const Icon = STEP_ICONS[i];
            return (
              <li key={label} className={cls('flex items-center', i < BID_STEPS.length - 1 && 'flex-1 min-w-[130px]')}>
                <button
                  className={cls('flex items-center gap-2 shrink-0 cursor-pointer', state !== 'pending' && 'hover:opacity-90')}
                  onClick={() => i <= step && go(i)}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  <span
                    className={cls(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 text-[11px] font-bold shrink-0',
                      state === 'done' && 'bg-green-600 border-green-600 text-white',
                      state === 'current' && 'bg-blue-700 border-blue-700 text-white ring-4 ring-blue-100 dark:ring-blue-900',
                      state === 'pending' && 'bg-white border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-600'
                    )}
                  >
                    {state === 'done' ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </span>
                  <span className={cls('text-xs font-semibold whitespace-nowrap', state === 'current' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400')}>
                    {String(i + 1).padStart(2, '0')} {label}
                  </span>
                </button>
                {i < BID_STEPS.length - 1 && <div className={cls('flex-1 h-0.5 mx-3 rounded', i < step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700')} />}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Step body */}
      <Card className="p-5 lg:p-6">
        {step === 0 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={Building2} title="01 — Company Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Legal Company Name" required>
                <input className="input" value={data.contact} onChange={(e) => set('contact', e.target.value)} onBlur={() => markTouched('contact')} />
              </Field>
              <Field label="Contractor ID">
                <input className="input bg-slate-100 dark:bg-slate-800/70" value={CONTRACTOR.id} readOnly />
              </Field>
              <Field label="Class / Registration">
                <input className="input bg-slate-100 dark:bg-slate-800/70" value={CONTRACTOR.class} readOnly />
              </Field>
              <Field label="GSTIN">
                <input className="input bg-slate-100 dark:bg-slate-800/70" value={CONTRACTOR.gstin} readOnly />
              </Field>
              <Field label="Authorized Signatory Name" required error={err('signatory', 'Enter the signatory name')}>
                <input className="input" placeholder="e.g. R. K. Sharma, Director" value={data.signatory} onChange={(e) => set('signatory', e.target.value)} onBlur={() => markTouched('signatory')} />
              </Field>
              <Field label="Designation" required>
                <input className="input" value={data.designation} onChange={(e) => set('designation', e.target.value)} onBlur={() => markTouched('designation')} />
              </Field>
              <Field label="Average Annual Turnover FY 2023-26 (₹ Cr)" required error={err('turnoverFY', 'Enter turnover as per audited statements')} hint={`Requirement: ≥ ₹${Math.round(tender.value / 2)} Cr for this tender`}>
                <input className="input" type="number" placeholder={String(CONTRACTOR.turnover)} value={data.turnoverFY} onChange={(e) => set('turnoverFY', e.target.value)} onBlur={() => markTouched('turnoverFY')} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={ShieldCheck} title="02 — Eligibility Declarations" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              AI pre-check against {CONTRACTOR.name}: <StatusBadge status={eligibilityStatus(tender)} />. Confirm the declarations below.
            </p>
            {[
              'We meet the turnover and class requirements specified in the tender.',
              'We have completed the required number of similar works in the qualifying period.',
              'Neither the company nor its proprietors are blacklisted by any government agency.',
              'EPF, ESIC, GST and all statutory registrations are active and up to date.',
            ].map((d, i) => (
              <label key={d} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 cursor-pointer hover:border-blue-300 transition-colors dark:border-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-blue-700"
                  checked={data.eligibilityDecls[i]}
                  onChange={(e) => {
                    const next = [...data.eligibilityDecls];
                    next[i] = e.target.checked;
                    set('eligibilityDecls', next);
                  }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{d}</span>
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={Wrench} title="03 — Technical Proposal" />
            <Field
              label="Methodology & Work Plan"
              required
              error={err('methodology', 'Describe methodology in at least 80 characters')}
              hint="Describe execution sequence, plant deployment, QC plan and monsoon contingencies."
            >
              <textarea
                className="input min-h-[140px]"
                value={data.methodology}
                onChange={(e) => set('methodology', e.target.value)}
                onBlur={() => markTouched('methodology')}
                placeholder="e.g. Execution in 3 sections with two paver trains. DBM and BC layers with mix design approval before each stretch. QC per MoRTH with third-party lab at 500 m intervals…"
              />
              <p className="text-[10px] text-slate-400 mt-1">{data.methodology.trim().length}/80 min</p>
            </Field>
            <Field label="Plant & Equipment Deployment" required error={err('equipment', 'List the key plant and equipment offered')}>
              <textarea
                className="input min-h-[90px]"
                value={data.equipment}
                onChange={(e) => set('equipment', e.target.value)}
                onBlur={() => markTouched('equipment')}
                placeholder="e.g. 2 pavers (owned), 3 vibratory rollers, 1 batching plant 30 m³/h, 6 tippers, 1 bitumen sprayer…"
              />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 cursor-pointer hover:border-blue-300 transition-colors dark:border-slate-700">
              <input type="checkbox" className="mt-0.5 w-4 h-4 accent-blue-700" checked={data.safetyPlan} onChange={(e) => set('safetyPlan', e.target.checked)} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Site safety plan per the tender's HSE schedule is enclosed, with a named safety officer and tool-box talk protocol.
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={IndianRupee} title="04 — Financial Proposal" />
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 text-sm text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-300">
              Estimated value: <strong>{cr(tender.value)}</strong> • EMD: <strong>{money(tender.emd)}</strong> • Bids above ±10% of estimate may attract justification.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Bid Amount (₹ Cr)" required error={err('bidAmount', 'Enter bid amount')} hint={overEstimate ? 'More than 110% of estimate — will need justification' : undefined}>
                <input className="input" type="number" step="0.01" value={data.bidAmount} onChange={(e) => set('bidAmount', e.target.value)} onBlur={() => markTouched('bidAmount')} placeholder="e.g. 41.75" />
              </Field>
              <Field label="Taxes & Duties (%)" required>
                <input className="input" type="number" value={data.taxPercent} onChange={(e) => set('taxPercent', e.target.value)} />
              </Field>
              <Field label="Bid Validity (days)">
                <select className="input cursor-pointer" value={data.validity} onChange={(e) => set('validity', e.target.value)}>
                  {['90', '120', '180'].map((v) => (
                    <option key={v} value={v}>{v} days</option>
                  ))}
                </select>
              </Field>
            </div>
            {amountNum > 0 && !overEstimate && (
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                Bid premium vs estimate: {(((amountNum - tender.value) / tender.value) * 100).toFixed(1)}% — within acceptable band.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={FileUp} title="05 — Documents" />
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200 dark:border-slate-700 dark:divide-slate-700">
              {REQUIRED_DOCS.map((d) => {
                const have = !missingDocs.includes(d);
                return (
                  <div key={d} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{d}</span>
                    {have ? (
                      <span className="text-[11px] font-bold text-green-700 dark:text-green-400">✓ Attached</span>
                    ) : (
                      <span className="text-[11px] font-bold text-red-600">Missing</span>
                    )}
                  </div>
                );
              })}
            </div>
            <DocumentUploader label="Upload Bid Documents" docs={data.docs} onChange={(d) => set('docs', d)} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Name files clearly, e.g. “Experience_Certificate_PWD.pdf”. The AI checks file names against the required list.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="max-w-2xl space-y-4">
            <SectionTitle icon={ClipboardList} title="06 — Review" />
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-200 dark:border-slate-700 dark:divide-slate-700">
              <Row k="Company" v={data.contact} />
              <Row k="Turnover declared" v={data.turnoverFY ? `₹ ${data.turnoverFY} Cr` : '—'} />
              <Row k="Eligibility declarations" v={`${data.eligibilityDecls.filter(Boolean).length} of 4 confirmed`} />
              <Row k="Methodology length" v={`${data.methodology.trim().length} chars`} />
              <Row k="Bid amount" v={amountNum > 0 ? cr(amountNum) : '—'} />
              <Row k="Taxes" v={`${data.taxPercent}%`} />
              <Row k="Validity" v={`${data.validity} days`} />
              <Row k="Documents" v={`${data.docs.length} attached${missingDocs.length ? ` • ${missingDocs.length} missing` : ''}`} />
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 cursor-pointer hover:border-blue-300 transition-colors dark:border-slate-700">
              <input type="checkbox" className="mt-0.5 w-4 h-4 accent-blue-700" checked={data.verified} onChange={(e) => set('verified', e.target.checked)} />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                I verify that the information and documents provided are true and correct to the best of my knowledge, and accept the terms of the tender.
              </span>
            </label>
          </div>
        )}

        {step === 6 && (
          <div className="max-w-xl text-center py-6">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">07 — Submit</p>
            <p className="text-sm text-slate-700 leading-relaxed mb-6 dark:text-slate-300">
              On submission, your bid will be locked and forwarded to {tender.department}. EMD of <strong>{money(tender.emd)}</strong> must be
              reachable in the designated account before the deadline. Bids cannot be edited after submission.
            </p>
            <div className={cls('rounded-lg border p-4 text-sm', stepValid(5) ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300')}>
              {stepValid(5) ? 'All checks passed — ready to submit.' : 'Complete the Review step confirmation before submitting.'}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 mt-6 pt-4 dark:border-slate-800">
          <button className="btn btn-secondary" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Step {step + 1} of {BID_STEPS.length}
          </span>
          {step < 6 ? (
            <button className="btn btn-primary" onClick={() => go(step + 1)}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setConfirmOpen(true)} disabled={!stepValid(5)}>
              <Send className="w-4 h-4" />
              Submit Bid
            </button>
          )}
        </div>
      </Card>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        title="Submit bid for evaluation?"
        message={`Your bid of ${amountNum > 0 ? cr(amountNum) : '—'} for ${tender.code} will be submitted to ${tender.department}. This action cannot be undone.`}
        confirmLabel="Submit Bid"
      />
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-3.5 py-2.5">
      <dt className="text-xs text-slate-500 font-semibold">{k}</dt>
      <dd className={cls('text-xs font-bold text-slate-800 text-right dark:text-slate-200', mono && 'font-mono')}>{v}</dd>
    </div>
  );
}
