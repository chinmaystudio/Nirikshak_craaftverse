import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ComplaintStatusBadge } from "@/components/common/StatusBadge";
import { SlaPill } from "@/components/complaints/SLAIndicator";
import { CommunityIssueCard } from "@/components/community/CommunityIssueCard";
import { ConfirmDialog } from "@/components/common/Modal";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { useAsync } from "@/hooks/useAsync";
import { useProjects } from "@/hooks/useProjects";
import { useComplaints } from "@/hooks/useComplaints";
import { useCommunityActions } from "@/hooks/useCommunity";
import { getAlerts, criticalUnreadAlerts } from "@/services/alerts/alertsService";
import { toast } from "@/hooks/useToast";
import { getWardStatistics } from "@/services/projects/projectsService";
import { greeting } from "@/utils/formatDate";
import { formatCr, formatNumber } from "@/utils/formatCurrency";
import { severityMeta } from "@/constants/alertSeverities";
import { ROUTES } from "@/constants/routes";
import type { CommunityIssueView } from "@/types/community";

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const { nearby, loading: projectsLoading, error, projects, reload } = useProjects();
  const complaintsState = useComplaints();
  const { confirm } = useCommunityActions();
  const alertsState = useAsync(() => getAlerts({}), []);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const ward = getWardStatistics();
  const critical = criticalUnreadAlerts();
  const alerts = alertsState.data ?? [];
  const near = nearby.slice(0, 3);
  const activeComplaints = complaintsState.complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").slice(0, 3);

  const recentIssues = useAsync(
    () =>
      getCommunityFeed("recent").then((issues) => issues.slice(0, 2)),
    [complaintsState.complaints.length]
  );

  const totalProjects = projects.length;

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-container/10 via-surface-container-low to-transparent p-6 rounded-2xl border border-outline-variant/50 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary/15 text-secondary text-[11px] font-bold uppercase tracking-wider mb-2 border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Citizen Infrastructure Transparency Portal
            </div>
            <h1 className="text-headline-lg font-headline-lg font-extrabold text-primary">
              {greeting()}, {user ? user.name.split(" ")[0] : "Citizen"}
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Track public works, inspect published expenditures, and review the latest verified infrastructure data.
            </p>
          </div>
          <div className="flex flex-col md:items-end text-label-sm text-outline gap-1.5 flex-shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 font-semibold text-primary shadow-2xs">
              📍 {user ? user.ward : "Pune Municipal Region"}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Public Audit Mode: <strong className="text-secondary font-bold">Active (FY 2026-27)</strong>
            </span>
          </div>
        </div>
        {critical[0] ? (
          <button
            onClick={() => navigate(`#/alerts/${critical[0].id}`)}
            className="w-full text-left bg-red-50/80 border border-red-200 border-l-4 border-l-error p-3.5 rounded-xl flex items-start gap-3 hover:bg-red-50 transition-colors shadow-2xs"
          >
            <Icon name="report" className="text-[20px] text-error flex-shrink-0 mt-0.5" />
            <span className="text-body-sm text-on-surface">
              <strong className="text-error font-bold">CRITICAL ALERT:</strong> {critical[0].title}{" "}
              <span className="text-secondary font-bold whitespace-nowrap ml-1 hover:underline">View details →</span>
            </span>
          </button>
        ) : null}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction label="Find Nearby Projects" sub="Map, budgets & timelines" icon="travel_explore" route={ROUTES.PROJECTS} warm />
        <QuickAction label="Report an Issue" sub="Guided, AI-assisted submission" icon="report" route={ROUTES.REPORT} warm />
        <QuickAction label="Track My Complaints" sub="SLA status & escalation" icon="receipt_long" route={ROUTES.COMPLAINTS} />
        <QuickAction label="Ask the AI Assistant" sub="Civic answers instantly" icon="smart_toy" route={ROUTES.ASSISTANT} />
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-8 p-5 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-secondary inline-flex items-center gap-1.5">
              <Icon name="auto_awesome" className="text-[15px]" /> NIRIKSHAK VISION
            </span>
            <h2 className="text-headline-sm font-bold text-primary">Understand Your Infrastructure</h2>
            <p className="text-body-sm text-on-surface-variant max-w-xl">
              Take a photo of a road, bridge, public building or construction site. NIRIKSHAK Vision assists with identification, shows published maintenance details, and
              connects it to the registered project and its transparency record.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="accent" icon="photo_camera" onClick={() => navigate(ROUTES.VISION)}>
                Identify Infrastructure
              </Button>
              <Button variant="outline" icon="history" onClick={() => navigate(ROUTES.VISION_HISTORY)}>
                My Infrastructure Checks
              </Button>
            </div>
          </div>
          <div className="md:col-span-4 bg-gradient-to-br from-primary-container to-tertiary hidden md:flex items-center justify-center p-6">
            <div className="relative w-24 h-24">
              <span className="absolute left-0 top-0 w-6 h-6 border-l-[3px] border-t-[3px] border-secondary-fixed/80 rounded-tl" />
              <span className="absolute right-0 top-0 w-6 h-6 border-r-[3px] border-t-[3px] border-secondary-fixed/80 rounded-tr" />
              <span className="absolute left-0 bottom-0 w-6 h-6 border-l-[3px] border-b-[3px] border-secondary-fixed/80 rounded-bl" />
              <span className="absolute right-0 bottom-0 w-6 h-6 border-r-[3px] border-b-[3px] border-secondary-fixed/80 rounded-br" />
              <span className="absolute inset-0 flex items-center justify-center">
                <Icon name="photo_camera" className="text-[44px] text-secondary-fixed" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <SectionHead
        title="Nearby Active Projects"
        sub={`Latest published status of public works closest to you in ${ward.name}`}
        link={ROUTES.PROJECTS}
        linkLabel="View all on map"
      />
      {projectsLoading ? (
        <LoadingSkeleton kind="cards" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {near.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-primary">Latest Alerts</h2>
            <a href={ROUTES.ALERTS} className="text-label-md text-secondary font-bold hover:underline">
              Alerts centre
            </a>
          </div>
          <div className="space-y-2.5">
            {alertsState.loading ? (
              <LoadingSkeleton kind="list" />
            ) : (
              alerts.slice(0, 3).map((a) => {
                const meta = severityMeta(a.severity);
                return (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/user/alerts/${a.id}`)}
                    className={`w-full text-left ${meta.cardClass} p-3 rounded-lg border border-outline-variant/20 space-y-1`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={meta.color}>
                        <Icon name={meta.icon} className="text-[18px]" />
                      </span>
                      <span className="text-label-md font-bold text-primary flex-1">{a.title}</span>
                      {!a.read ? <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" /> : null}
                    </div>
                    <div className="text-label-sm text-on-surface-variant flex items-center gap-2">
                      <span className={`${meta.color} font-bold`}>{meta.label}</span>• {a.area}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-primary">My Active Complaints</h2>
            <a href={ROUTES.COMPLAINTS} className="text-label-md text-secondary font-bold hover:underline">
              View all
            </a>
          </div>
          {!auth.isLoggedIn ? (
            <EmptyState icon="lock" title="Sign in to track complaints" text="Sign in with your registered email and password to see complaint status." ctaLabel="Login" ctaRoute={ROUTES.LOGIN} />
          ) : complaintsState.loading ? (
            <LoadingSkeleton kind="list" />
          ) : activeComplaints.length > 0 ? (
            <div className="space-y-3">
              {activeComplaints.map((c) => (
                <a key={c.id} href={`#/complaints/${c.id}`} className="block p-3.5 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-label-md font-bold text-primary">{c.id}</span>
                    <SlaPill complaint={c} />
                  </div>
                  <div className="text-body-sm font-semibold text-primary mt-1 truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <ComplaintStatusBadge status={c.status} />
                    <span className="text-label-sm text-outline">{c.department}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="task_alt"
              title="No active complaints"
              text="All your reported issues are resolved. Notice something new?"
              ctaLabel="Report an Issue"
              ctaRoute={ROUTES.REPORT}
            />
          )}
        </section>
      </div>

      <SectionHead
        title="Community Issues Near You"
        sub="Verified problems reported by fellow citizens in your wards"
        link={ROUTES.COMMUNITY}
        linkLabel="Open community"
      />
      {recentIssues.loading ? (
        <LoadingSkeleton kind="list" />
      ) : (
        <div className="space-y-4">
          {(recentIssues.data ?? []).map((issue: CommunityIssueView) => (
            <CommunityIssueCard key={issue.id} issue={issue} onConfirm={(id) => setConfirmTarget(id)} />
          ))}
        </div>
      )}

      <section className="bg-surface-container-lowest p-5 md:p-6 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-headline-sm font-bold text-primary">Ward Accountability Snapshot</h2>
            <p className="text-body-sm text-on-surface-variant">
              {ward.name} • FY 2026-27 public dashboard
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PROJECTS)}>
            Full transparency ledger →
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Projects" value={ward.projects} sub="Sanctioned works" icon="construction" />
          <StatCard label="On Track" value={ward.onTrack} sub="As per schedule" icon="task_alt" />
          <StatCard label="Delayed" value={ward.delayed} sub={`${ward.critical} under critical review`} icon="running_with_errors" subTone="text-error" circleClass="bg-error-container/40 text-error" />
          <StatCard label="Project Value" value={formatCr(ward.totalValueCr)} sub={`${formatCr(ward.spentFYCr)} spent this FY`} icon="payments" />
          <StatCard label="Resolution Rate" value={`${ward.resolutionRate}%`} sub={`${ward.resolved} of ${ward.complaints} complaints`} icon="fact_check" circleClass="bg-green-100 text-green-800" />
          <StatCard label="Avg Redressal" value={`${ward.avgDays} days`} sub="Departmental average" icon="speed" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-outline-variant/30 pt-4">
          <div className="space-y-2">
            <h3 className="text-label-md font-bold text-primary">Project Status Distribution ({totalProjects} tracked on portal)</h3>
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-surface-container-high">
              {ward.statusSplit.map((s) => (
                <div key={s.label} className={s.className} style={{ width: `${Math.round((s.value / ward.projects) * 100)}%` }} title={`${s.label}: ${s.value}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-label-sm text-on-surface-variant">
              {ward.statusSplit.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.className}`} /> {s.label} ({s.value})
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-label-md font-bold text-primary">Contractor Performance (Public Scorecard)</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container text-primary text-label-sm">
                    <th className="p-2 rounded-l">Contractor</th>
                    <th className="p-2">Works</th>
                    <th className="p-2">On-Time</th>
                    <th className="p-2">Quality</th>
                    <th className="p-2 rounded-r">Safety</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {ward.contractors.slice(0, 4).map((c) => (
                    <tr key={c.name}>
                      <td className="p-2 font-semibold text-primary whitespace-nowrap">{c.name}</td>
                      <td className="p-2">{c.projects}</td>
                      <td className="p-2">{c.onTime}</td>
                      <td className="p-2">{c.quality}</td>
                      <td className="p-2">{c.safety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="text-label-sm text-outline">{formatNumber(12490)} grievances redressed across the network • Avg 6.4 days</div>
      </section>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Confirm this issue?"
        text="Your confirmation strengthens the community evidence pack shared with the department."
        okLabel="Confirm Issue"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) void confirm(confirmTarget).then(() => toast("Thank you — your confirmation strengthens this issue's case.", "success"));
          setConfirmTarget(null);
          void recentIssues.reload();
        }}
      />
    </div>
  );
}

import { getCommunityFeed } from "@/services/community/communityService";
function SectionHead({ title, sub, link, linkLabel }: { title: string; sub: string; link: string; linkLabel: string }): JSX.Element {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-headline-md font-headline-md font-extrabold text-primary">{title}</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">{sub}</p>
      </div>
      <a
        href={link}
        className="inline-flex items-center gap-1 text-secondary font-label-md text-label-md font-bold hover:underline whitespace-nowrap group"
      >
        <span>{linkLabel}</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </div>
  );
}

function QuickAction({ label, sub, icon, route, warm = false }: { label: string; sub: string; icon: string; route: string; warm?: boolean }): JSX.Element {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(route)}
      className={`group text-left cursor-pointer p-5 rounded-2xl border shadow-2xs transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex items-start gap-4 ${
        warm
          ? "bg-gradient-to-br from-[#FFFDF7] to-[#FEF7E6] border-amber-200/90 hover:border-secondary hover:ring-1 hover:ring-secondary/30"
          : "bg-surface-container-lowest border-outline-variant/60 hover:border-primary/40 hover:bg-surface-container-low/40"
      }`}
    >
      <div
        className={`p-3 rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs ${
          warm
            ? "bg-gradient-to-br from-secondary to-[#b36200] text-on-secondary"
            : "bg-gradient-to-br from-primary-container to-primary text-on-primary"
        }`}
      >
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div>
        <h3 className="text-label-md font-bold text-primary group-hover:text-secondary transition-colors leading-tight">
          {label}
        </h3>
        <p className="text-body-sm text-on-surface-variant mt-1 leading-normal">{sub}</p>
      </div>
    </button>
  );
}
