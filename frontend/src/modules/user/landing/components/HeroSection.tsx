import React from 'react';
import { ArrowRight, Shield, ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onExploreProjects: () => void;
  onHowItWorks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreProjects,
  onHowItWorks
}) => {
  return (
    <div className="relative pt-12 sm:pt-20 pb-20 min-h-[90vh] flex items-center">
      {/* Directional Scrim for Left-Aligned Text readability over video */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/75 to-transparent pointer-events-none" />

      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-4xl">
          {/* Small Eyebrow */}
          <div className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-6 drop-shadow-md">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>NIRIKSHAK • INFRASTRUCTURE INTELLIGENCE &amp; ACCOUNTABILITY</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight font-display leading-[1.04] mb-6 drop-shadow-2xl">
            <span className="text-[#eefc55]">ONE PROJECT.</span>
            <br />
            <span className="text-white">THREE PORTALS.</span>
            <br />
            <span className="text-[#eefc55]">ONE VERIFIED TRUTH.</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-100 font-normal leading-relaxed max-w-2xl mb-10 drop-shadow-lg">
            NIRIKSHAK connects Government authorities, contractors and citizens through one evidence-driven infrastructure lifecycle — from project sanction and tendering to execution, verification and public transparency.
          </p>

          {/* Two CTAs only */}
          <div className="flex flex-wrap items-center gap-4 mb-16">
            <button
              id="hero-btn-how-it-works"
              onClick={onHowItWorks}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-extrabold text-base bg-[#eefc55] hover:bg-white text-neutral-950 shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Explore How It Works</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-btn-explore-projects"
              onClick={onExploreProjects}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-bold text-base bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>View Public Projects</span>
              <ArrowDown className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Bottom Hero Micro-Flow */}
          <div className="pt-8 border-t border-white/15 max-w-2xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Cross-Portal Synchronization Architecture
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="font-extrabold uppercase tracking-wider text-amber-400">Government</span>
                <span className="text-slate-300 font-medium">Sanction • Tender • Verify</span>
              </div>

              <div className="text-center text-[11px] font-bold text-slate-400 tracking-wider">
                ↕ REALTIME PROJECT RECORD ↕
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="font-extrabold uppercase tracking-wider text-[#eefc55]">Contractor</span>
                <span className="text-slate-300 font-medium">Bid • Execute • Report</span>
              </div>

              <div className="text-center text-[11px] font-bold text-slate-400 tracking-wider">
                ↕ VERIFIED PUBLIC DATA ↕
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="font-extrabold uppercase tracking-wider text-emerald-400">Citizen</span>
                <span className="text-slate-300 font-medium">Track • Report • Participate</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
