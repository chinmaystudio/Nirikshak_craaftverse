import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-react';

export const ContractorIntelligenceSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Discover Tender',
      subtitle: 'Published Government Opportunities',
      desc: 'Browse open tenders published by verified government authorities with detailed technical specs, milestone definitions, and budget estimates.',
      details: [
        'Filter tenders by sector, location, and eligibility criteria',
        'Download official specifications and milestone expectations',
        'Automated pre-bid clarification windows'
      ],
      stateText: 'Tender Public • Open for Bids'
    },
    {
      num: '02',
      title: 'Submit Bid',
      subtitle: 'Secure Organization-Linked Submission',
      desc: 'Submit technical and financial bids through an isolated contractor workspace protected by PostgreSQL Row-Level Security.',
      details: [
        'Sealed bid architecture with cryptographic submission timestamps',
        'Organization isolation: competitor bids are mathematically invisible',
        'Validation of company registration and authorized signers'
      ],
      stateText: 'Bid Encrypted • Awaiting Evaluation'
    },
    {
      num: '03',
      title: 'Receive Award',
      subtitle: 'Selected Contractor Receives Assignment',
      desc: 'Upon official government selection, the project workspace is automatically provisioned and assigned directly to the winning organization.',
      details: [
        'Instant contractor portal access upon letter of award',
        'Project record bound to contractor organization ID',
        'Milestone baseline schedule established in database'
      ],
      stateText: 'Award Certified • Workspace Provisioned'
    },
    {
      num: '04',
      title: 'Execute Project',
      subtitle: 'Milestones & Project Workspace',
      desc: 'Manage site execution against official milestone targets with real-time tracking of workfronts, resource deployment, and task completions.',
      details: [
        'Dedicated contractor dashboard with assigned project portfolio',
        'Milestone progress decomposition and daily site logs',
        'Real-time communication and notice management'
      ],
      stateText: 'Execution Active • Milestones Tracked'
    },
    {
      num: '05',
      title: 'Report Progress',
      subtitle: 'Progress + Evidence Submission',
      desc: 'Submit reported physical completion percentages accompanied by geo-tagged photos, site documentation, and measurement notes.',
      details: [
        'Upload site documentation and measurement logs',
        'Claimed progress flagged as "Reported" in system',
        'AI pre-checks for schedule variance and documentation completeness'
      ],
      stateText: 'Evidence Submitted • Pending Verification'
    },
    {
      num: '06',
      title: 'Receive Review',
      subtitle: 'Approved • Rejected • Clarification Required',
      desc: 'Authorized government officers inspect site evidence and render official determinations: approved, rejected, or clarification needed.',
      details: [
        'Approved progress transitions to official "Verified" status',
        'Rejected claims require resubmission with required rectification',
        'Immutable audit entry created for every determination'
      ],
      stateText: 'Government Determination Rendered'
    }
  ];

  const current = steps[activeStep];

  return (
    <section id="contractor-section" className="min-h-screen py-24 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>CONTRACTOR LIFECYCLE</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            From Bid to Build.
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            A secure, organization-isolated portal for contractor enterprises to discover opportunities, manage assigned projects, and submit verifiable execution evidence.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {steps.map((item, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={item.num}
                onClick={() => setActiveStep(idx)}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 backdrop-blur-sm ${
                  isSelected
                    ? 'bg-black/60 border-[#eefc55] shadow-lg scale-[1.02]'
                    : 'bg-black/30 border-white/10 hover:border-amber-400/50 hover:bg-black/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#eefc55]' : 'text-amber-400'}`}>
                    {item.num}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    STEP {item.num}
                  </span>
                </div>

                <h3 className={`text-xl font-bold font-display mb-1 ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                  {item.title}
                </h3>
                <div className="text-xs font-bold uppercase tracking-wide text-amber-400 mb-2">
                  {item.subtitle}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Step Detailed View */}
        <div className="bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                STAGE {current.num} WORKFLOW SPECIFICATION
              </div>
              <h4 className="text-2xl font-bold text-white font-display">
                {current.title} — {current.subtitle}
              </h4>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-bold self-start md:self-auto">
              ✓ {current.stateText}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {current.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#eefc55] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
          <div>
            <strong className="text-white">RLS Privacy Guarantee: </strong>
            Contractor A can NEVER access or query Contractor B&apos;s bids, contracts, assigned projects, or progress reports.
          </div>
          <span className="font-mono text-[#eefc55] shrink-0">
            Organization-Isolated Workspaces
          </span>
        </div>
      </div>
    </section>
  );
};
