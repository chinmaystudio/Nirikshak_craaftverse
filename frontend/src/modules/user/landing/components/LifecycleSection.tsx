import React, { useState } from 'react';
import { LIFECYCLE_STAGES } from '../data/platformFeatures';
import { LifecycleStageInfo } from '../types';

export const LifecycleSection: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<LifecycleStageInfo>(LIFECYCLE_STAGES[0]);

  return (
    <section id="lifecycle-section" className="min-h-screen py-24 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
            ✦ END-TO-END PROJECT PIPELINE
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight mt-2 mb-4 leading-tight">
            The 10-Stage Lifecycle
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            From initial budget sanction to ground execution, AI evidence review, government verification, and public transparency.
          </p>
        </div>

        {/* 10-Stage Interactive Switcher */}
        <div className="mb-10 pb-6 border-b border-white/15">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {LIFECYCLE_STAGES.map((stage) => {
              const isSelected = selectedStage.step === stage.step;
              return (
                <button
                  key={stage.step}
                  id={`lifecycle-step-btn-${stage.step}`}
                  onClick={() => setSelectedStage(stage)}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#eefc55] text-neutral-950 font-black scale-105 shadow-lg'
                      : 'bg-black/40 text-slate-300 hover:text-white border border-white/20 hover:border-amber-400'
                  }`}
                >
                  {stage.step} {stage.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              STAGE {selectedStage.step} — {selectedStage.name}
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              {selectedStage.title}
            </h3>
          </div>
          <div className="max-w-md text-sm text-slate-200 leading-relaxed">
            <strong className="text-[#eefc55]">Objective: </strong>
            {selectedStage.objective}
          </div>
        </div>

        {/* 4 Clean Columns: Government Action | Contractor Action | System Verification | Outputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="pt-4 border-t-2 border-blue-500 bg-black/30 p-5 rounded-b-lg backdrop-blur-sm border border-t-2 border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <span>🏛️</span> Government Action
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedStage.governmentAction}
            </p>
          </div>

          <div className="pt-4 border-t-2 border-emerald-500 bg-black/30 p-5 rounded-b-lg backdrop-blur-sm border border-t-2 border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>⛑️</span> Contractor Action
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedStage.contractorAction}
            </p>
          </div>

          <div className="pt-4 border-t-2 border-amber-400 bg-black/30 p-5 rounded-b-lg backdrop-blur-sm border border-t-2 border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <span>⚡</span> System Verification
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedStage.aiVerification}
            </p>
          </div>

          <div className="pt-4 border-t-2 border-purple-400 bg-black/30 p-5 rounded-b-lg backdrop-blur-sm border border-t-2 border-white/10">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
              <span>📋</span> Certified Output
            </div>
            <div className="space-y-1.5 mt-2">
              {selectedStage.outputs.map((out, idx) => (
                <div key={idx} className="text-xs text-slate-200 flex items-center gap-1.5">
                  <span className="text-[#eefc55] font-bold">✓</span> {out}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
