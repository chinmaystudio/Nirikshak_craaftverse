import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, FileText, Lock, ShieldCheck, UserCheck } from 'lucide-react';

interface UnifiedGovernanceSummaryProps {
  onNavigateSection?: (sectionId: string) => void;
}

interface DataFlowPillar {
  id: string;
  tab: string;
  category: string;
  headline: string;
  description: string;
  createdBy: string;
  readBy: string;
  verifiedBy: string;
  publicValue: string;
  securityRule: string;
  sampleItems: string[];
}

export const UnifiedGovernanceSummary: React.FC<UnifiedGovernanceSummaryProps> = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const dataFlowTabs: DataFlowPillar[] = [
    {
      id: '01',
      tab: 'PROCUREMENT',
      category: 'Tender & Bidding',
      headline: 'Tenders, Sealed Bids & Letter of Award',
      description: 'Government publishes public tenders. Authenticated contractors submit encrypted bids in isolated workspaces.',
      createdBy: 'Government (Tender specs & budget) • Contractor (Sealed technical & financial bids)',
      readBy: 'Government (All bids unsealed post-deadline) • Contractor (Own submitted bid only)',
      verifiedBy: 'Government Tender Evaluation Committee',
      publicValue: 'Awarded contractor name, contract value, timeline and project specifications',
      securityRule: 'Contractor organization isolation: Competitor bids are mathematically invisible to other bidders.',
      sampleItems: ['Tender Notice & Scope', 'Sealed Contractor Proposals', 'Bid Evaluation Matrix', 'Signed Contract Agreement']
    },
    {
      id: '02',
      tab: 'EXECUTION',
      category: 'Milestone Progress',
      headline: 'Progress Submissions & Ground Evidence',
      description: 'Contractors document physical construction, milestone completions, and site inspection logs.',
      createdBy: 'Contractor Project Team',
      readBy: 'Contractor Organization & Authorized Government Authority',
      verifiedBy: 'Government Field Engineers / PIU Reviewers',
      publicValue: 'Unverified contractor claims remain private; only verified progress is published.',
      securityRule: 'Claimed progress does NOT update public records until formal government verification.',
      sampleItems: ['Milestone Progress Percentage', 'Geo-tagged Site Documentation', 'Workfront Completion Logs', 'Interim Payment Invoices']
    },
    {
      id: '03',
      tab: 'VERIFICATION',
      category: 'Official Oversight',
      headline: 'Inspection Determinations & Sanctions',
      description: 'Designated government officers examine physical site reality, evaluate evidence, and approve or reject claims.',
      createdBy: 'Government Project Officers & Field Engineers',
      readBy: 'Government Authority & Assigned Contractor',
      verifiedBy: 'Authorized Senior Project Officer / Competent Authority',
      publicValue: 'Official verified percentage, verification timestamp, and official project status',
      securityRule: 'Constitutional human-in-the-loop: No automated fund releases or status promotions without officer approval.',
      sampleItems: ['Site Inspection Orders', 'Progress Approval / Rejection Orders', 'Measurement Book Approvals', 'Statutory Milestone Sanctions']
    },
    {
      id: '04',
      tab: 'CITIZEN FEEDBACK',
      category: 'Public Accountability',
      headline: 'Ground Grievances & Corrective Actions',
      description: 'Citizens submit ground observations or complaints; government triages and assigns contractor corrective actions.',
      createdBy: 'Citizens (Complaints & photos) • Government (Directives) • Contractor (Remediation)',
      readBy: 'Reporting Citizen, Government Oversight Team, and Assigned Contractor',
      verifiedBy: 'Government Grievance Officer',
      publicValue: 'Issue classification, resolution timeline, and public redressal verification status',
      securityRule: 'Whistleblower and citizen privacy protected; remediation tracked until verified closed.',
      sampleItems: ['Citizen Ground Reports', 'Location-tagged Incident Logs', 'Contractor Action Evidence', 'Officer Closure Certification']
    },
    {
      id: '05',
      tab: 'AI',
      category: 'Cognitive Advisory',
      headline: 'Nemotron Cognitive Risk & Variance Signals',
      description: 'NIRIKSHAK AI evaluates baseline milestones against ground submissions to highlight risk trajectories.',
      createdBy: 'NIRIKSHAK Intelligence (NVIDIA Nemotron via OpenRouter + Deterministic Calculators)',
      readBy: 'Government Reviewers & Assigned Contractor (Contextual alerts)',
      verifiedBy: 'Government Officer (Accepts, rejects, or clarifies AI insights)',
      publicValue: 'High-level project health status and verified forecast milestones',
      securityRule: 'AI provides decision support only. AI cannot execute contracts, disburse funds, or modify data.',
      sampleItems: ['Schedule Delay Trajectory', 'Financial vs Physical Divergence', 'Milestone Slippage Alerts', 'Recommended Review Actions']
    },
    {
      id: '06',
      tab: 'AUDIT',
      category: 'Tamper-Evident History',
      headline: 'Permanent Traceable Decision Ledger',
      description: 'Every submission, edit, verification, rejection, and fund event creates an immutable audit trail.',
      createdBy: 'System Triggered (PostgreSQL Row Triggers & Authentication Handshakes)',
      readBy: 'Government Audit Officers, Vigilance Observers, and System Administrators',
      verifiedBy: 'Cryptographic Event Timestamps & Supabase RLS Policies',
      publicValue: 'Public verification timestamps and milestone certification chronology',
      securityRule: 'Append-only logs: Historical entries cannot be modified or purged by any portal user.',
      sampleItems: ['Authentication Logs', 'Verification Decision Records', 'RLS Policy Audits', 'Milestone State Transition History']
    }
  ];

  const current = dataFlowTabs[activeTab];

  return (
    <section id="governance-summary-section" className="min-h-screen py-24 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Cross-Portal Access Control &amp; Data Pipeline</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
            How Data Moves Through NIRIKSHAK
          </h2>
          <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed max-w-2xl">
            Who creates it, who can read it, who verifies it, and what becomes public. A clean security architecture with strict role isolation.
          </p>
        </div>

        {/* 6 Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-10 pb-6 border-b border-white/15">
          {dataFlowTabs.map((p, idx) => {
            const isSelected = activeTab === idx;
            return (
              <button
                key={p.tab}
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#eefc55] text-neutral-950 font-black shadow-lg scale-105'
                    : 'bg-black/40 text-slate-300 hover:text-white border border-white/20 hover:border-amber-400'
                }`}
              >
                {p.id} • {p.tab}
              </button>
            );
          })}
        </div>

        {/* Selected Tab Deep Dive */}
        <div className="bg-black/35 p-6 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10 mb-8">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                DATA DOMAIN {current.id} — {current.category}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {current.headline}
              </h3>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {current.description}
              </p>
            </div>

            <div className="shrink-0 max-w-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold text-[#eefc55] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#eefc55]" />
                Security Rule
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {current.securityRule}
              </p>
            </div>
          </div>

          {/* 4 Access Matrix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* WHO CREATES IT */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 border-t-2 border-t-blue-400">
              <div className="text-xs font-bold uppercase text-blue-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Who Creates It
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {current.createdBy}
              </p>
            </div>

            {/* WHO CAN READ IT */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 border-t-2 border-t-amber-400">
              <div className="text-xs font-bold uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Who Can Read It
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {current.readBy}
              </p>
            </div>

            {/* WHO CAN VERIFY IT */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 border-t-2 border-t-emerald-400">
              <div className="text-xs font-bold uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Who Verifies It
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {current.verifiedBy}
              </p>
            </div>

            {/* WHAT BECOMES PUBLIC */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 border-t-2 border-t-[#eefc55]">
              <div className="text-xs font-bold uppercase text-[#eefc55] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                What Becomes Public
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {current.publicValue}
              </p>
            </div>
          </div>

          {/* Sample Data Artifacts */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mr-2">
              Domain Artifacts:
            </span>
            {current.sampleItems.map((item, idx) => (
              <span key={idx} className="text-xs text-slate-300 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                ✓ {item}
              </span>
            ))}
          </div>
        </div>

        {/* Security Standard Footer */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
          <div>
            <strong className="text-white">Security Model: </strong>
            PostgreSQL Row-Level Security (RLS) guarantees contractors only query their own records, while government officers oversee their authority jurisdiction.
          </div>
          <span className="font-mono text-[#eefc55] shrink-0">
            Reported ≠ Verified ≠ Public
          </span>
        </div>
      </div>
    </section>
  );
};
