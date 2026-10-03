import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';

export const ProjectMonitoringSection: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<'approved' | 'rejected'>('approved');

  return (
    <section id="monitoring-section" className="min-h-screen py-24 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>PROGRESS VERIFICATION STANDARD</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            Reported Is Not Verified.
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            Contractor submissions remain reported evidence until an authorized Government officer verifies them. Only verified values become official public progress.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/15">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Verification Scenarios:
          </span>
          <button
            onClick={() => setActiveScenario('approved')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'approved'
                ? 'bg-[#eefc55] text-neutral-950 font-black shadow-lg scale-105'
                : 'bg-black/40 text-slate-300 hover:text-white border border-white/20'
            }`}
          >
            Scenario A: Accepted &amp; Verified Progress
          </button>
          <button
            onClick={() => setActiveScenario('rejected')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'rejected'
                ? 'bg-rose-500 text-white font-black shadow-lg scale-105'
                : 'bg-black/40 text-slate-300 hover:text-white border border-white/20'
            }`}
          >
            Scenario B: Rejected Claim Protection
          </button>
        </div>

        {/* Big Numerical Comparison Display */}
        {activeScenario === 'approved' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Step 1: Contractor Reported */}
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                01 / CONTRACTOR REPORTED
              </div>
              <div className="text-6xl sm:text-7xl font-black text-amber-300 font-display tracking-tight my-2">
                78%
              </div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Unverified Contractor Claim
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contractor submits milestone progress percentage with preliminary site inspection logs and invoice.
              </p>
            </div>

            {/* Step 2: Government Verified */}
            <div className="p-8 rounded-2xl bg-black/40 border border-blue-400/40 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-2">
                02 / GOVERNMENT VERIFIED
              </div>
              <div className="text-6xl sm:text-7xl font-black text-blue-300 font-display tracking-tight my-2">
                71%
              </div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Ground Inspection Determination</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Designated engineer audits ground completion, excludes non-compliant section, and certifies 71%.
              </p>
            </div>

            {/* Step 3: Citizen Sees */}
            <div className="p-8 rounded-2xl bg-black/40 border border-[#eefc55]/40 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-[#eefc55] uppercase tracking-wider mb-2">
                03 / CITIZEN SEES
              </div>
              <div className="text-6xl sm:text-7xl font-black text-[#eefc55] font-display tracking-tight my-2">
                71%
              </div>
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#eefc55]" />
                <span>Official Public Truth</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Citizen Portal projects strictly the verified 71%. The unverified 78% claim was never made public.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Step 1: Contractor Reports */}
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                01 / CONTRACTOR REPORTS
              </div>
              <div className="text-6xl sm:text-7xl font-black text-amber-300 font-display tracking-tight my-2">
                60%
              </div>
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Premature / Discrepant Submission
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contractor claims 60% completion on structural bridge piers without requisite curing test reports.
              </p>
            </div>

            {/* Step 2: Government Decision */}
            <div className="p-8 rounded-2xl bg-black/40 border border-rose-500/40 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-2">
                02 / GOVERNMENT DECISION
              </div>
              <div className="text-5xl sm:text-6xl font-black text-rose-400 font-display tracking-tight my-2">
                REJECTED
              </div>
              <div className="text-xs font-semibold text-rose-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Deficiency Flagged • Rework Ordered</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Officer inspects site reality, rejects ungrounded claim, and orders contractor to rectify testing records.
              </p>
            </div>

            {/* Step 3: Citizen Value */}
            <div className="p-8 rounded-2xl bg-black/40 border border-[#eefc55]/40 backdrop-blur-sm relative overflow-hidden">
              <div className="text-xs font-mono font-bold text-[#eefc55] uppercase tracking-wider mb-2">
                03 / CITIZEN VALUE
              </div>
              <div className="text-5xl sm:text-6xl font-black text-slate-200 font-display tracking-tight my-2">
                REMAINS 71%
              </div>
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#eefc55]" />
                <span>Public Integrity Preserved</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Public metric stays at previous verified state (71%). False claims never distort public transparency.
              </p>
            </div>
          </div>
        )}

        {/* Narrative Callout */}
        <div className="p-6 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              THE CONSTITUTIONAL RULE OF NIRIKSHAK
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              No contractor claim enters public awareness or accounting ledgers until an authenticated government officer reviews ground evidence and signs the verification order.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <span className="text-xs font-mono text-[#eefc55] px-4 py-2 rounded-full bg-white/5 border border-white/10">
              Reported ≠ Verified ≠ Public
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
