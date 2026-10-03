import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const principles = [
    {
      num: '01',
      title: 'One Source of Truth',
      desc: 'Every tender, sealed bid, contract award, milestone progress submission, inspection determination, and public update stays connected to the same project record in PostgreSQL.'
    },
    {
      num: '02',
      title: 'Role-Based Access',
      desc: 'Government officers collaborate within authority workspaces; contractors work in secure organization-isolated workspaces protected by RLS; citizens access verified public views.'
    },
    {
      num: '03',
      title: 'Reported ≠ Verified',
      desc: 'Contractor submissions remain reported evidence until an authorized government officer verifies them. Only verified values become official public progress.'
    },
    {
      num: '04',
      title: 'AI Assists — Humans Decide',
      desc: 'NIRIKSHAK AI uses deterministic calculations and NVIDIA Nemotron to flag schedule risks and evidence gaps. Final administrative and financial decisions remain strictly with officers.'
    },
    {
      num: '05',
      title: 'Citizen Transparency',
      desc: 'Citizens track verified project status, budgets, and milestones, while reporting ground issues that trigger contractor corrective actions verified by government.'
    },
    {
      num: '06',
      title: 'Permanent Audit History',
      desc: 'Every milestone update, officer review, rejection reason, and fund milestone creates an immutable timestamped event log ensuring complete public accountability.'
    }
  ];

  return (
    <section id="about-section" className="min-h-screen py-24 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
            ✦ PLATFORM PHILOSOPHY &amp; ARCHITECTURE
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight mt-2 mb-4 leading-tight">
            About NIRIKSHAK
          </h2>
          <p className="text-lg text-slate-200 leading-relaxed font-medium">
            NIRIKSHAK is an evidence-driven infrastructure monitoring and accountability platform connecting Government authorities, contractors and citizens through a shared project lifecycle.
          </p>
        </div>

        {/* 6 Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {principles.map((p) => (
            <div key={p.num} className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm relative">
              <div className="text-xs font-mono font-bold text-amber-400 mb-2">
                PRINCIPLE {p.num}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                {p.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
