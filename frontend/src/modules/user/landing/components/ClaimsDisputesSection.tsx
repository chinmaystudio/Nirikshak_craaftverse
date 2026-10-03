import React from 'react';
import { ArrowRight, CheckCircle2, Clock, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';

export const ClaimsDisputesSection: React.FC = () => {
  const resolutionSteps = [
    {
      num: '01',
      title: 'Citizen Reports Issue',
      actor: 'Citizen',
      desc: 'Ground observation submitted via Citizen Portal with location, category, and photo evidence.'
    },
    {
      num: '02',
      title: 'Government Receives Complaint',
      actor: 'Government Authority',
      desc: 'Officer examines report, validates jurisdictional scope, and logs official grievance docket.'
    },
    {
      num: '03',
      title: 'Corrective Action Assigned',
      actor: 'Government Authority',
      desc: 'Formal remediation directive issued to the assigned contractor organization with resolution deadline.'
    },
    {
      num: '04',
      title: 'Contractor Responds With Evidence',
      actor: 'Contractor',
      desc: 'Contractor executes on-site corrective measures and uploads time-stamped proof of completion.'
    },
    {
      num: '05',
      title: 'Government Verifies Resolution',
      actor: 'Government Officer',
      desc: 'Engineer verifies that remediation conforms to safety standards before closing the ticket.'
    },
    {
      num: '06',
      title: 'Citizen Receives Final Status',
      actor: 'Citizen & Public',
      desc: 'Reporting citizen and general public receive certified closure notification on portal.'
    }
  ];

  return (
    <section id="claims-section" className="min-h-screen py-24 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>COMMUNITY PARTICIPATION &amp; REDRESSAL</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            From Ground Issue to Verified Resolution.
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            Citizens become active partners in infrastructure oversight. Complaints flow directly to government authorities, trigger contractor corrective actions, and resolve with public proof.
          </p>
        </div>

        {/* 6-Step Resolution Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {resolutionSteps.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm relative"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-amber-400">
                  STEP {step.num}
                </span>
                <span className="text-[11px] font-semibold text-[#eefc55] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {step.actor}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Real-World Case Example Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-black/50 border border-emerald-500/30 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 mb-6">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                LIVE RESOLUTION WORKFLOW EXAMPLE
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white font-display">
                Unsafe Pedestrian Diversion at Metro Pier 22
              </h4>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 text-xs font-mono font-bold self-start sm:self-auto">
              RESOLVED &amp; VERIFIED
            </div>
          </div>

          {/* Micro-flow line */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold mb-6">
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15">
              1. SUBMITTED
            </span>
            <span className="text-amber-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15">
              2. ASSIGNED
            </span>
            <span className="text-amber-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40">
              3. CORRECTIVE ACTION
            </span>
            <span className="text-amber-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/40">
              4. VERIFIED
            </span>
            <span className="text-amber-400">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              5. RESOLVED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-4 border-t border-white/10">
            <div>
              <strong className="text-white block mb-0.5">Reported By:</strong>
              Citizen commuter (Geo-tagged hazard photo attached)
            </div>
            <div>
              <strong className="text-white block mb-0.5">Contractor Action:</strong>
              Barricades reinforced, pedestrian walkway paved and illuminated
            </div>
            <div>
              <strong className="text-white block mb-0.5">Final Verification:</strong>
              Executive Engineer on-site verification confirmed closed
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
