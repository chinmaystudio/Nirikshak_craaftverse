import React from 'react';
import { AI_CAPABILITIES } from '../data/platformFeatures';
import { ArrowDown, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AIIntelligenceSection: React.FC = () => {
  return (
    <section id="ai-framework-section" className="min-h-screen py-24 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
            ✦ COGNITIVE VERIFICATION ARCHITECTURE
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight mt-2 mb-4 leading-tight">
            AI Assists. <br />
            <span className="text-slate-300">Evidence Grounds It. </span><br />
            <span className="text-[#eefc55]">Government Decides.</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            NIRIKSHAK grounds language and machine intelligence in verifiable site evidence, milestone baselines, and deterministic variance calculations.
          </p>
        </div>

        {/* 3 Architecture Columns: Evidence -> Analysis -> Human Decision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 border-b border-white/15">
          {/* 01 — EVIDENCE */}
          <div className="bg-black/35 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="text-xs font-mono font-bold text-amber-400 mb-2">
              01 / EVIDENCE
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Project Context
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Ground-truth project facts ingested across official submissions:
            </p>
            <div className="space-y-2.5">
              {[
                'Tender & contract baselines',
                'Milestone target dates & physical scope',
                'Contractor progress reports & site logs',
                'Government verification determinations',
                'Citizen signals & ground complaints',
                'Authorized external observations'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400">
              Structured database context • Zero ungrounded hallucination
            </div>
          </div>

          {/* 02 — ANALYSIS */}
          <div className="bg-black/35 p-6 rounded-xl border border-[#eefc55]/30 backdrop-blur-sm relative">
            <div className="text-xs font-mono font-bold text-[#eefc55] mb-2">
              02 / ANALYSIS
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              NIRIKSHAK Intelligence
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Multi-tiered reasoning combining deterministic math with LLM analysis:
            </p>
            <div className="space-y-3">
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-white">Deterministic Calculations</div>
                <div className="text-[11px] text-slate-300">Milestone velocity & variance math</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-[#eefc55]" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-white">Evidence Context Aggregation</div>
                <div className="text-[11px] text-slate-300">Multi-source log correlation</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-[#eefc55]" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-amber-400/40 text-xs">
                <div className="font-semibold text-amber-300">NVIDIA Nemotron via OpenRouter</div>
                <div className="text-[11px] text-slate-300">Structured cognitive risk reasoning</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-[#eefc55]" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-white">Structured Risk Insight</div>
                <div className="text-[11px] text-slate-300">Severity, confidence & recommended action</div>
              </div>
            </div>
          </div>

          {/* 03 — HUMAN DECISION */}
          <div className="bg-black/35 p-6 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
            <div className="text-xs font-mono font-bold text-emerald-400 mb-2">
              03 / HUMAN DECISION
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-display">
              Government Review
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Constitutional authority remains strictly with authorized officers:
            </p>
            <div className="space-y-3">
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-slate-200">AI-Generated Insight</div>
                <div className="text-[11px] text-slate-400">Objective advisory signal</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-slate-200">Evidence Review</div>
                <div className="text-[11px] text-slate-400">Officer examines site reality & claims</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-emerald-400/30 text-xs">
                <div className="font-semibold text-emerald-300">Accept / Reject / Request Data</div>
                <div className="text-[11px] text-slate-300">Human determination applied</div>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-white/5 p-2.5 rounded border border-white/10 text-xs">
                <div className="font-semibold text-white">Official Government State</div>
                <div className="text-[11px] text-slate-300">Permanent certified project record</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real AI Capabilities */}
        <div className="pt-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                ✦ SYSTEM CAPABILITIES
              </span>
              <h3 className="text-3xl font-extrabold text-white font-display mt-1">
                NIRIKSHAK Analytical Capabilities
              </h3>
            </div>
            {/* Prominent Disclaimer Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold self-start md:self-auto">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>AI-derived insight • Government verification required</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_CAPABILITIES.map((c) => (
              <div key={c.id} className="pt-4 border-t-2 border-white/20 bg-black/25 p-5 rounded-b-lg border border-white/10 backdrop-blur-sm">
                <div className="text-xs font-mono font-bold text-[#eefc55] mb-1">
                  {c.id} / ANALYTIC MODULE
                </div>
                <h4 className="text-xl font-bold text-white mb-1">
                  {c.title}
                </h4>
                <div className="text-xs font-bold uppercase text-amber-400 tracking-wider mb-2">
                  {c.subtitle}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                  {c.desc}
                </p>
                <div className="text-xs font-semibold text-emerald-400">
                  ✦ Dimension: {c.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
