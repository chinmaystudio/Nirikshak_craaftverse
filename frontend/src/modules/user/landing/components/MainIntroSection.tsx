import React from 'react';
import { ArrowRight, ShieldCheck, Database, Eye, Users } from 'lucide-react';

interface MainIntroSectionProps {
  onExploreLifecycle: () => void;
  onExploreAI: () => void;
}

export const MainIntroSection: React.FC<MainIntroSectionProps> = ({
  onExploreLifecycle,
  onExploreAI
}) => {
  return (
    <section id="main-intro-section" className="py-24 bg-transparent text-white relative">
      {/* Directional Scrim for Left-Aligned visual anchor */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/70 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 font-display">
            ✦ ONE SOURCE OF TRUTH • ROLE-SPECIFIC ACCESS
          </span>
        </div>

        <div className="mb-14 max-w-4xl">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white font-display tracking-tight leading-[1.08] mb-6">
            ONE PROJECT.<br />
            <span className="text-[#eefc55]">ONE CONNECTED RECORD.</span>
          </h2>

          <p className="text-slate-200 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl">
            Every tender, bid, contract, progress submission, verification, complaint and public update stays connected to the same project record.
          </p>
        </div>

        {/* 3 Big Workspaces Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 my-12 border-t border-white/15 pt-10">
          <div className="flex flex-col justify-between pt-4 border-t-2 border-amber-400">
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 mb-2">
                01 / AUTHORITY COLLABORATION
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">
                SHARED GOVERNMENT WORKSPACE
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Authorized Government officers within the same authority work from the same project data. When Officer A sanctions a project, Officer B and C review the same live record.
              </p>
              <div className="text-xs font-semibold text-amber-300 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20 inline-block">
                Projects • Tenders • Reviews • Complaints
              </div>
            </div>
            <button
              onClick={onExploreLifecycle}
              className="inline-flex items-center gap-2 mt-8 text-xs font-bold text-[#eefc55] hover:text-white transition-colors cursor-pointer"
            >
              <span>Explore 10-Stage Lifecycle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col justify-between pt-4 border-t-2 border-[#eefc55]">
            <div>
              <div className="text-xs font-mono font-bold text-[#eefc55] mb-2">
                02 / COMPANY DATA ISOLATION
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">
                ISOLATED CONTRACTOR WORKSPACE
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Each contractor organization sees only its own bids, contracts, assigned projects and submissions. Users within the same company share access, while competitor data remains private.
              </p>
              <div className="text-xs font-semibold text-[#eefc55] bg-[#eefc55]/10 px-3 py-2 rounded-lg border border-[#eefc55]/20 inline-block">
                Organization-level RLS protection
              </div>
            </div>
            <button
              onClick={onExploreAI}
              className="inline-flex items-center gap-2 mt-8 text-xs font-bold text-amber-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>Explore Decision Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col justify-between pt-4 border-t-2 border-emerald-400">
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 mb-2">
                03 / PUBLIC TRANSPARENCY
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">
                VERIFIED CITIZEN VIEW
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Citizens receive public project information only after the appropriate Government verification workflow. Unverified contractor claims never appear as official public reality.
              </p>
              <div className="text-xs font-semibold text-emerald-300 bg-emerald-400/10 px-3 py-2 rounded-lg border border-emerald-400/20 inline-block">
                Reported ≠ Verified ≠ Public
              </div>
            </div>
            <div className="mt-8 text-xs font-bold text-slate-400">
              Zero-Trust Verification Pipeline
            </div>
          </div>
        </div>

        {/* Real Metrics Spread */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/15">
          <div>
            <div className="text-4xl sm:text-5xl font-black text-[#eefc55] font-display mb-1">
              3
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Connected Portals
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Government • Contractor • Citizen
            </div>
          </div>

          <div>
            <div className="text-4xl sm:text-5xl font-black text-white font-display mb-1">
              1
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Supabase Source of Truth
            </div>
            <div className="text-xs text-slate-300 mt-1">
              PostgreSQL • Auth • Realtime
            </div>
          </div>

          <div>
            <div className="text-4xl sm:text-5xl font-black text-[#eefc55] font-display mb-1">
              Realtime
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Cross-Portal Synchronization
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Instant notification &amp; audit feeds
            </div>
          </div>

          <div>
            <div className="text-4xl sm:text-5xl font-black text-white font-display mb-1">
              RLS
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Role-Based Data Isolation
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Tenant security enforced at database row level
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
