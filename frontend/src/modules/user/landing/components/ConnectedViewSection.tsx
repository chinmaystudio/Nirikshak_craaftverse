import React from 'react';

export const ConnectedViewSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      name: 'GOVERNMENT',
      role: 'Project Ownership',
      sub: 'Sanctions • Tenders • Verification',
      tagColor: 'text-amber-400'
    },
    {
      num: '02',
      name: 'CONTRACTOR',
      role: 'Project Execution',
      sub: 'Bids • Progress • Evidence',
      tagColor: 'text-[#eefc55]'
    },
    {
      num: '03',
      name: 'CITIZEN',
      role: 'Public Accountability',
      sub: 'Projects • Complaints • Updates',
      tagColor: 'text-emerald-400'
    },
    {
      num: '04',
      name: 'SUPABASE',
      role: 'Single Source of Truth',
      sub: 'Auth • PostgreSQL • Realtime',
      tagColor: 'text-cyan-400'
    },
    {
      num: '05',
      name: 'NIRIKSHAK AI',
      role: 'Evidence Interpretation',
      sub: 'Risk • Variance • Recommendations',
      tagColor: 'text-purple-400'
    },
    {
      num: '06',
      name: 'AUDIT TRAIL',
      role: 'Permanent Record',
      sub: 'Who • What • When',
      tagColor: 'text-slate-300'
    }
  ];

  return (
    <section id="connected-view-section" className="relative z-20 px-4 sm:px-6 lg:px-8 py-16">
      {/* Subtle Right Directional Scrim for alternating visual pacing */}
      <div className="absolute inset-0 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto border-t border-b border-white/15 py-12 relative z-10">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-display mb-2">
            ✦ ARCHITECTURAL INTEGRATION
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Everyone Works From the Same Project Lifecycle.
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            One shared project record, distinct tenant permissions, and verifiable evidence at every transaction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          {pillars.map((item, idx) => (
            <div key={idx} className="flex flex-col pt-3 border-t border-white/20">
              <span className={`text-xs font-bold ${item.tagColor} font-display mb-1`}>
                {item.num} / {item.role}
              </span>
              <span className="text-base font-extrabold text-white mb-1 tracking-wide">
                {item.name}
              </span>
              <span className="text-xs text-slate-300 leading-relaxed font-medium">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
