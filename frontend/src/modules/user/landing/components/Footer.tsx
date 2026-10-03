import React from 'react';
import { ArrowUp, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black/80 backdrop-blur-md text-white border-t border-white/15 pt-16 pb-12 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eefc55] text-neutral-950 font-black text-xl flex items-center justify-center font-display shadow-md">
                N
              </div>
              <div>
                <div className="font-extrabold text-xl font-display text-white tracking-wider">
                  NIRIKSHAK
                </div>
                <div className="text-xs text-amber-400 font-medium">
                  Infrastructure Intelligence &amp; Accountability
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Connecting government authorities, contractors, and citizens through one evidence-driven infrastructure lifecycle — enabling transparent monitoring, verifiable records, and public trust.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-slate-400">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                PostgreSQL Row-Level Security
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#eefc55]">
                Realtime Data Synchronization
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-4">
              Lifecycle &amp; Portals
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {[
                { label: '10-Stage Lifecycle', id: 'lifecycle-section' },
                { label: 'Data Movement Matrix', id: 'governance-summary-section' },
                { label: 'Contractor Workflow', id: 'contractor-section' },
                { label: 'Progress Verification', id: 'monitoring-section' },
                { label: 'Financial Alignment', id: 'finance-section' }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigateSection(link.id)}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-4">
              System Architecture
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {[
                { label: 'AI Risk Advisory', id: 'ai-framework-section' },
                { label: 'Schedule Risk Modeling', id: 'risk-section' },
                { label: 'Citizen Redressal', id: 'claims-section' },
                { label: 'Live Database Metrics', id: 'reports-section' },
                { label: 'Public Projects Catalog', id: 'projects-section' }
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigateSection(link.id)}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider mb-4">
              Data Principles
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-[#eefc55] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#eefc55]" />
                <span>Reported ≠ Verified ≠ Public</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Contractor progress remains reported evidence until officially verified by designated government officers.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>© 2026 NIRIKSHAK. Evidence-driven infrastructure intelligence and accountability platform.</div>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-white transition-colors font-bold cursor-pointer"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
