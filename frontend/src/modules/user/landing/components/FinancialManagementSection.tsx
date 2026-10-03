import React from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, IndianRupee, ShieldCheck } from 'lucide-react';

export const FinancialManagementSection: React.FC = () => {
  const financialFlow = [
    {
      step: '01',
      value: '₹250 Cr',
      label: 'SANCTIONED BUDGET',
      desc: 'Legislative and administrative capital expenditure approval.'
    },
    {
      step: '02',
      value: '₹220 Cr',
      label: 'TENDER ESTIMATE',
      desc: 'Detailed project report (DPR) engineering estimate baseline.'
    },
    {
      step: '03',
      value: '₹214 Cr',
      label: 'AWARDED CONTRACT',
      desc: 'Market-tested competitive contract price bound to contractor.'
    },
    {
      step: '04',
      value: '37%',
      label: 'VERIFIED PHYSICAL PROGRESS',
      desc: 'Official certified ground execution audited by government PIU.'
    },
    {
      step: '05',
      value: 'FINANCIAL REVIEW',
      label: 'LINKED TO VERIFIED RECORDS',
      desc: 'Running account bills reconciled directly with certified progress.'
    }
  ];

  const fiscalPillars = [
    {
      title: 'Tender Baseline Reconciliation',
      metric: 'Sanction to Award',
      desc: 'Tracks variance between original administrative sanction, published tender estimate, and awarded contract value to maintain fiscal governance.'
    },
    {
      title: 'Milestone Progress Correlation',
      metric: 'Progress-Gated Review',
      desc: 'Ensures milestone billing requests are evaluated strictly against verified physical completion records signed by field engineers.'
    },
    {
      title: 'Physical vs Fiscal Divergence',
      metric: 'Divergence Advisory',
      desc: 'Algorithmic checks flag discrepancies if cumulative billing rate outpaces certified physical construction velocity.'
    }
  ];

  return (
    <section id="finance-section" className="min-h-screen py-24 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-display">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span>FISCAL DISCIPLINE &amp; PROJECT ACCOUNTS</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            Follow the Money With the Work.
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            Every rupee disbursed connects directly to a verified milestone in the project record. Sanctions, tenders, awards, and execution stay continuously aligned.
          </p>
        </div>

        {/* 5-Step Financial Flow (Horizontal on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-14">
          {financialFlow.map((item, idx) => (
            <div
              key={item.step}
              className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm relative flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-mono font-bold text-amber-400 mb-2">
                  STAGE {item.step}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#eefc55] font-display mb-1">
                  {item.value}
                </div>
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  {item.label}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2 pt-2 border-t border-white/10">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 3 Fiscal Integrity Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/15">
          {fiscalPillars.map((pillar, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {pillar.metric}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-2">
                {pillar.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <strong className="text-slate-200">Financial Audit Principle: </strong>
            Disbursement approvals require linked verification records signed by authorized engineers.
          </div>
          <span className="font-mono text-emerald-400 shrink-0">
            Sanctioned → Contracted → Executed → Verified
          </span>
        </div>
      </div>
    </section>
  );
};
