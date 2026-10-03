import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const RiskDelaySection: React.FC = () => {
  return (
    <section id="risk-section" className="min-h-screen py-24 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>AI RISK INSIGHT &amp; DECISION SUPPORT</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            AI Warns. <br />
            <span className="text-[#eefc55]">Government Decides.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            See what an actual NIRIKSHAK AI risk insight looks like. Grounded evidence, clear confidence scores, and actionable recommendations for government officers.
          </p>
        </div>

        {/* 2-Column Layout: Left = Real AI Insight Card, Right = Context & Philosophy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Real AI Insight Card */}
          <div className="lg:col-span-7 bg-black/60 p-6 sm:p-8 rounded-2xl border border-amber-400/40 backdrop-blur-md relative shadow-2xl">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                    AI-ASSISTED PROJECT REVIEW
                  </div>
                  <div className="text-sm font-bold text-white">
                    Corridor Section 4B • Milestone Review
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Confidence:</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 font-mono text-xs font-extrabold">
                  0.78
                </span>
              </div>
            </div>

            {/* Risk Assessment Block */}
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                  Assessed Risk Level
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black tracking-wide">
                  SCHEDULE RISK • MEDIUM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Deterministic calculation indicates progress velocity is currently insufficient to meet Milestone 3 delivery without catch-up reallocation.
              </p>
            </div>

            {/* Evidence Checklist */}
            <div className="mb-6">
              <div className="text-xs font-bold uppercase text-amber-400 tracking-wider mb-3">
                Identified Ground Evidence
              </div>
              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Progress behind current milestone: Reported 54% vs Planned 62% baseline.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Utility relocation issue reported: High-tension line clearance pending at Ch. 44+200.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Completion date pressure increasing: Critical path buffer reduced by 18 days.</span>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
              <div className="text-xs font-bold uppercase text-blue-300 tracking-wider mb-1">
                Recommended Action for Officer
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Review revised execution schedule with contractor and coordinate utility shifting priority with local power transmission authority.
              </p>
            </div>

            {/* Mandatory Status Banner */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>STATUS: AI-DERIVED • GOVERNMENT REVIEW REQUIRED</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Engine: Nemotron / NIRIKSHAK AI
              </div>
            </div>
          </div>

          {/* Right: How It Works & Philosophy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Ground-Truth Grounding
              </div>
              <h3 className="text-xl font-bold text-white font-display mb-2">
                No Ungrounded AI Claims
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                NIRIKSHAK AI never invents delays or produces generic summaries. Every advisory point references specific database entries: milestone schedules, contractor daily reports, and uploaded site observations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm">
              <div className="text-xs font-bold text-[#eefc55] uppercase tracking-wider mb-2">
                Human-in-the-Loop Sovereign Control
              </div>
              <h3 className="text-xl font-bold text-white font-display mb-2">
                Algorithms Advise, Humans Rule
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The platform strictly forbids automated contract modifications, liquidated damages deductions, or termination notices. AI provides the mathematical early warning; designated government officers determine the administrative action.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-3">
              <span className="text-[#eefc55] font-bold text-base">⚖️</span>
              <span>Audit compliance: Every officer response to an AI insight is recorded permanently in the project timeline.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
