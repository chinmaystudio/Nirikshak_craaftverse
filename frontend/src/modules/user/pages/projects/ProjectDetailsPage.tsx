import { useEffect, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { Tabs } from "@/components/common/Tabs";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ComplaintStatusBadge } from "@/components/common/StatusBadge";
import { ProjectHero, IdentityTable, VisionStrip } from "@/components/projects/ProjectHeader";
import { ProjectTimeline, DelayCallout } from "@/components/projects/ProjectTimeline";
import { FinancialSummary, ProgressPanel, MilestoneMiniList } from "@/components/projects/ProjectProgress";
import { ContractorInfo } from "@/components/projects/ContractorInfo";
import { DocumentsTable, PhotoLog, ImportantDates } from "@/components/projects/ProjectDocuments";
import { useNavigate, useLocation, getRouteId } from "@/app/router";
import { useAsync } from "@/hooks/useAsync";
import { getProjectById } from "@/services/projects/projectsService";
import { getMyComplaints } from "@/services/complaints/complaintsService";
import { getCommunityFeed } from "@/services/community/communityService";
import { formatCr } from "@/utils/formatCurrency";
import { shortDate } from "@/utils/formatDate";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financial Transparency" },
  { id: "contractor", label: "Contractor" },
  { id: "progress", label: "Progress" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" }
];

export function ProjectDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const { query } = useLocation();
  const urlId = getRouteId();
  const [tab, setTab] = useState<string>(query.tab ?? "overview");
  const state = useAsync(() => getProjectById(urlId), [urlId]);
  const complaintsState = useAsync(() => getMyComplaints(), []);
  const issuesState = useAsync(() => getCommunityFeed("recent"), []);
  const [headerHeight, setHeaderHeight] = useState(112);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) setHeaderHeight(header.offsetHeight);
  }, []);

  if (state.loading) return <LoadingSkeleton kind="detail" />;
  if (state.error || !state.data) {
    return (
      <ErrorState
        notFound={state.notFound}
        message={state.error ?? "Project not found."}
        onRetry={state.notFound ? undefined : state.reload}
      />
    );
  }

  const p = state.data;
  const relatedComplaints = (complaintsState.data ?? []).filter((c) => c.projectId === p.id);
  const relatedIssues = (issuesState.data ?? []).filter((i) => i.projectId === p.id);

  const body = (): JSX.Element => {
    switch (tab) {
      case "financials":
        return (
          <div className="space-y-5">
            <FinancialSummary project={p} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <Panel title="Funding Sources">
                <dl className="space-y-2.5 text-body-sm">
                  {[
                    ["Funding model", p.finance.fundingModel],
                    ["Funding source", p.finance.fundingSource],
                    ["Cost variance", p.finance.varianceNote],
                    ["Last financial update", shortDate(p.latestUpdate.date)],
                    ["Audit status", "Quarterly public audit active"]
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 rounded bg-surface-container-low border border-outline-variant/30">
                      <dt className="text-label-sm font-bold text-primary uppercase tracking-wide">{k}</dt>
                      <dd className="text-on-surface-variant mt-0.5">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <Panel title="Reading the Numbers — Citizen Guide">
                <ul className="space-y-2.5 text-body-sm text-on-surface-variant">
                  <li>
                    <strong className="text-primary">Sanctioned</strong> — the amount approved when the project was cleared.
                  </li>
                  <li>
                    <strong className="text-primary">Revised</strong> — updated cost after scope or price changes, with reasons published.
                  </li>
                  <li>
                    <strong className="text-primary">Spent</strong> — actual payments made to the contractor, audited quarterly.
                  </li>
                  <li>
                    <strong className="text-primary">Remaining</strong> — balance still held by the executing agency.
                  </li>
                  <li className="text-label-sm text-outline pt-1 border-t border-outline-variant/30">
                    All figures audited under the CAG/NIC public financial reporting cycle.
                  </li>
                </ul>
              </Panel>
            </div>
          </div>
        );
      case "contractor":
        return <ContractorInfo project={p} />;
      case "progress":
        return (
          <div className="space-y-5">
            <ProgressPanel project={p} />
            {p.delay ? <DelayCallout delay={p.delay} dates={p.dates} /> : null}
            <Panel title="Milestone Progress">
              <MilestoneMiniList project={p} />
            </Panel>
          </div>
        );
      case "timeline":
        return (
          <div className="space-y-5">
            {p.delay ? <DelayCallout delay={p.delay} dates={p.dates} /> : null}
            <Panel title="Contract Lifecycle & Execution Timeline">
              <ProjectTimeline milestones={p.timeline} />
            </Panel>
          </div>
        );
      case "documents":
        return (
          <div className="space-y-4">
            <DocumentsTable project={p} />
            <p className="text-label-sm text-outline flex items-start gap-1.5">
              <Icon name="info" className="text-[15px] flex-shrink-0" />
              Only publicly releasable records are listed here — DPRs, work orders, inspection and audit reports. Personal and security-sensitive
              material is withheld under the disclosure policy.
            </p>
          </div>
        );
      default:
        return (
          <div className="space-y-5">
            <section className="space-y-2">
              <h2 className="text-headline-md font-headline-md font-bold text-primary">Why This Project Is Required</h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-4xl">{p.why}</p>
            </section>
            <section className="space-y-3">
              <h2 className="text-headline-md font-headline-md font-bold text-primary">Scope of Work</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {p.scope.map((x) => (
                  <li key={x} className="flex items-start gap-2 text-body-md text-on-surface">
                    <span className="text-secondary mt-0.5">
                      <Icon name="check_circle" className="text-[18px]" />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-[#FEF9EE] border border-[#FDE68A] border-l-4 border-l-secondary rounded-lg p-4 md:p-5 space-y-1.5">
              <h2 className="text-headline-sm font-bold text-primary flex items-center gap-2">
                <Icon name="volunteer_activism" className="text-[20px] text-secondary" /> Expected Public Benefit
              </h2>
              <p className="text-body-md text-on-surface leading-relaxed">{p.benefit}</p>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <PhotoLog project={p} />
              <div className="lg:col-span-5 space-y-5">
                <Panel title="Project Identity">
                  <IdentityTable project={p} />
                </Panel>
                <Panel title="Important Dates">
                  <ImportantDates project={p} />
                </Panel>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
        <button
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-1.5 text-primary font-label-md text-label-md hover:text-secondary transition-colors"
        >
          <Icon name="arrow_back" className="text-[20px]" /> <span>Back to Nearby Projects</span>
        </button>
        <Button variant="accent" size="sm" icon="report" onClick={() => navigate(`/report?project=${p.id}`)}>
          Report an Issue with this Project
        </Button>
      </div>

      <ProjectHero project={p} />

      <div
        className="sticky z-30 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant/40 -mx-1 px-1 shadow-sm"
        style={{ top: `${headerHeight}px` }}
      >
        <Tabs items={TABS} activeId={tab} onChange={setTab} ariaLabel="Project information tabs" />
      </div>

      {body()}

      <div className="space-y-5">
        <VisionStrip projectId={p.id} />
        <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-primary">Public Complaints on this Project</h2>
            <button onClick={() => navigate(`/report?project=${p.id}`)} className="text-label-md text-secondary font-bold hover:underline">
              Add yours →
            </button>
          </div>
          {relatedComplaints.length > 0 ? (
            <div className="space-y-2">
              {relatedComplaints.map((c) => (
                <a key={c.id} href={`#/complaints/${c.id}`} className="block p-3 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-label-sm font-bold text-primary">{c.id}</span>
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                  <div className="text-body-sm text-on-surface-variant mt-0.5 truncate">{c.title}</div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant p-2">No complaints linked to this project yet — be the first to report an issue.</p>
          )}
          {relatedIssues.length > 0 ? (
            <div className="pt-2 border-t border-outline-variant/30">
              <h3 className="text-label-md font-bold text-primary mb-2">Community issues on this project</h3>
              <div className="space-y-2">
                {relatedIssues.map((i) => (
                  <a key={i.id} href={`#/community/${i.id}`} className="block p-3 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors">
                    <div className="text-body-sm font-semibold text-primary">{i.title}</div>
                    <div className="text-label-sm text-outline mt-0.5">
                      {i.confirmations} confirmations • {i.affected} affected
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
        <p className="text-label-sm text-outline">
          Sanctioned {formatCr(p.finance.sanctionedAmount)} • Figures audited quarterly under the CAG/NIC public financial reporting cycle.
        </p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <section className="bg-surface-container-lowest p-5 md:p-6 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
      <h2 className="text-headline-sm font-headline-sm font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}
