import { ScrollCanvasBackground } from './components/ScrollCanvasBackground';
import { HeroSection } from './components/HeroSection';
import { ConnectedViewSection } from './components/ConnectedViewSection';
import { MainIntroSection } from './components/MainIntroSection';
import { LifecycleSection } from './components/LifecycleSection';
import { AIIntelligenceSection } from './components/AIIntelligenceSection';
import { UnifiedGovernanceSummary } from './components/UnifiedGovernanceSummary';
import { ContractorIntelligenceSection } from './components/ContractorIntelligenceSection';
import { ProjectMonitoringSection } from './components/ProjectMonitoringSection';
import { FinancialManagementSection } from './components/FinancialManagementSection';
import { RiskDelaySection } from './components/RiskDelaySection';
import { ClaimsDisputesSection } from './components/ClaimsDisputesSection';
import { ReportsSection } from './components/ReportsSection';
import { ProjectsExplorer } from './components/ProjectsExplorer';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import './index.css';

export function LandingPage(): JSX.Element {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="nirikshak-landing-scope min-h-screen flex flex-col bg-neutral-950/60 text-white selection:bg-[#eefc55] selection:text-black relative">
      {/* 266-Frame Scroll Canvas Animation in Fixed Background */}
      <ScrollCanvasBackground />

      {/* Top Fixed Navigation Bar */}
      <header
        id="main-nav"
        className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl transition-all"
      >
        <div className="flex items-center gap-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('hero');
            }}
            className="flex items-center gap-3 group"
          >
            <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/20 transition-transform group-hover:scale-[1.02]">
              <img
                src="/logo/nirikshak-logo.png"
                alt="NIRIKSHAK Logo"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-neutral-300">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-[#eefc55] transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('lifecycle-section')}
              className="hover:text-[#eefc55] transition-colors cursor-pointer"
            >
              10-Stage Lifecycle
            </button>
            <button
              onClick={() => scrollToSection('ai-framework-section')}
              className="hover:text-[#eefc55] transition-colors cursor-pointer"
            >
              AI Framework
            </button>
            <button
              onClick={() => scrollToSection('projects-section')}
              className="hover:text-[#eefc55] transition-colors cursor-pointer"
            >
              Portfolios
            </button>
            <button
              onClick={() => scrollToSection('about-section')}
              className="hover:text-[#eefc55] transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>
        </div>

        <a
          href="/user/app"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#eefc55]/70 bg-[#eefc55] px-3.5 sm:px-5 text-xs sm:text-sm font-bold text-neutral-950 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eefc55] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          Enter User Portal
        </a>

      </header>

      <main className="flex-grow relative z-10 pt-16">
        <HeroSection
          onExploreProjects={() => scrollToSection('projects-section')}
          onHowItWorks={() => scrollToSection('about-section')}
        />
        <ConnectedViewSection />
        <MainIntroSection
          onExploreLifecycle={() => scrollToSection('lifecycle-section')}
          onExploreAI={() => scrollToSection('ai-framework-section')}
        />
        <LifecycleSection />
        <AIIntelligenceSection />
        <UnifiedGovernanceSummary onNavigateSection={scrollToSection} />
        <ContractorIntelligenceSection />
        <ProjectMonitoringSection />
        <FinancialManagementSection />
        <RiskDelaySection />
        <ClaimsDisputesSection />
        <ReportsSection />
        <ProjectsExplorer />
        <AboutSection />
      </main>

      <Footer
        onNavigateSection={scrollToSection}
      />
    </div>
  );
}

export default LandingPage;
