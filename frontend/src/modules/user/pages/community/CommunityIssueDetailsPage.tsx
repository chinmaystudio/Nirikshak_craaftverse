import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/StatCard";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { CommunityStatusBadge } from "@/components/common/StatusBadge";
import { ConfirmationMeter, ConfirmationList, CommunityIssueSummary, RelatedProjectMini } from "@/components/community/CommunityIssueCard";
import { CommentsSection } from "@/components/community/CommunityComments";
import { ProjectMap, MapLegend } from "@/components/projects/ProjectMap";
import { Modal } from "@/components/common/Modal";
import { useNavigate, getRouteId } from "@/app/router";
import { useAsync } from "@/hooks/useAsync";
import { useAppState } from "@/app/providers/store";
import { toast } from "@/hooks/useToast";
import { getCommunityIssue, confirmIssue, upvoteIssue, addComment } from "@/services/community/communityService";
import { shortDate } from "@/utils/formatDate";
import { communityIssueRoute } from "@/constants/routes";
import type { CommunityIssueView } from "@/types/community";

const TONES: Record<string, string> = {
  roads: "from-amber-200 to-amber-50",
  safety: "from-red-200 to-red-50",
  water: "from-blue-200 to-blue-50",
  smart: "from-violet-200 to-violet-50",
  environment: "from-green-200 to-green-50"
};

export function CommunityIssueDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const id = getRouteId();
  const created = useAppState((s) => s.created);
  const confirmedCount = useAppState((s) => s.confirmed.length);
  const state = useAsync(() => getCommunityIssue(id), [id, created.length, confirmedCount]);
  const [lightbox, setLightbox] = useState<{ name: string; meta: string; tone: string } | null>(null);

  if (state.loading) return <LoadingSkeleton kind="detail" />;
  if (state.error || !state.data) {
    return (
      <ErrorState
        notFound={state.notFound}
        message={state.error ?? "Issue not found."}
        onRetry={state.notFound ? undefined : state.reload}
      />
    );
  }

  const issue: CommunityIssueView = state.data;
  const refresh = (): void => state.reload();

  return (
    <div className="space-y-6">
      <PageHeader
        title={issue.title}
        sub={`${issue.category} • ${issue.location}`}
        back
        onBack={() => navigate("/community")}
        actions={<CommunityStatusBadge status={issue.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
            <CommunityIssueSummary issue={issue} />
            <p className="text-body-md text-on-surface-variant leading-relaxed">{issue.description}</p>
            <div>
              <h3 className="text-label-md font-bold text-primary mb-2">Evidence Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issue.evidence.map((e) => (
                  <button
                    key={e.name}
                    onClick={() => setLightbox({ name: e.name, meta: e.meta, tone: e.tone })}
                    className="relative rounded-lg overflow-hidden h-32 border border-outline-variant/50 hover:ring-2 hover:ring-secondary/50 transition-all bg-gradient-to-br from-surface-container-high to-surface-container-low flex flex-col items-center justify-center gap-1 p-2"
                  >
                    <Icon name="image" className="text-[26px] text-primary-container/60" />
                    <span className="text-[10px] font-mono text-primary break-all leading-tight">{e.name}</span>
                    <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-surface-container-lowest px-2 py-1 text-[10px] truncate">{e.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
            <h2 className="text-headline-sm font-bold text-primary">Issue Timeline</h2>
            <ol className="relative">
              {issue.timeline.map((t, i) => {
                const done = t.status === "completed";
                const current = t.status === "current";
                const circle = done
                  ? "bg-primary text-on-primary"
                  : current
                    ? "bg-secondary text-on-secondary animate-pulse"
                    : "bg-surface-container-highest text-outline border-2 border-outline-variant/50";
                const tone = done ? "text-primary" : current ? "text-secondary" : "text-outline";
                return (
                  <li key={t.id} className="relative pl-10 pb-5 last:pb-0">
                    <span className={`absolute left-0 top-0 w-8 h-8 rounded-full ${circle} flex items-center justify-center text-label-sm font-bold z-10`}>
                      {done ? "✓" : current ? <Icon name="play_arrow" className="text-[16px]" /> : <Icon name="radio_button_unchecked" className="text-[15px]" />}
                    </span>
                    {t.status !== "upcoming" && i < issue.timeline.length - 1 ? (
                      <span className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-outline-variant/40" aria-hidden="true" />
                    ) : null}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className={`text-label-md font-bold ${tone}`}>{t.title}</span>
                      <span className="text-label-sm text-outline font-mono">{t.date ? shortDate(t.date) : "Scheduled"}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{t.description}</p>
                  </li>
                );
              })}
            </ol>
          </section>

          {issue.govResponse ? (
            <section className="bg-surface-container-low border-l-4 border-secondary p-5 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-secondary font-bold text-label-md">
                <Icon name="verified" className="text-[17px]" />
                Government Response: {issue.govResponse.by}
                <span className="text-outline font-normal ml-auto">{shortDate(issue.govResponse.at)}</span>
              </div>
              <p className="text-body-md text-on-surface-variant">{issue.govResponse.text}</p>
            </section>
          ) : null}

          {issue.resolution ? (
            <section className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 p-5 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-green-800 font-bold text-headline-sm">
                <Icon name="task_alt" className="text-[22px]" /> Resolution Verified
              </div>
              <p className="text-body-md text-on-surface">{issue.resolution.note}</p>
              <p className="text-label-sm text-green-800 font-semibold">Closed {shortDate(issue.resolution.closedAt)} • Verified by community confirmations</p>
            </section>
          ) : null}

          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm">
            <CommentsSection
              issue={issue}
              onSubmit={(text) => {
                void addComment(issue.id, text).then(() => {
                  toast("Comment posted to the civic thread.", "success");
                  refresh();
                });
              }}
            />
          </section>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <section className="bg-[#FEF9EE] border border-[#FDE68A] p-5 rounded-xl space-y-3">
            <h2 className="text-headline-sm font-bold text-primary">Community Verification</h2>
            <ConfirmationMeter pct={issue.confirmPct} />
            <div className="text-body-sm text-on-surface-variant">
              Community confirmation reflects how many nearby citizens have personally verified this issue. Departments treat highly confirmed
              issues as priority evidence.
            </div>
            <Button
              variant={issue.userConfirmed ? "soft" : "accent"}
              className="w-full"
              disabled={issue.userConfirmed}
              onClick={() => {
                void confirmIssue(issue.id).then(() => {
                  toast("Confirmation recorded — thank you for strengthening civic evidence.", "success");
                  refresh();
                });
              }}
            >
              {issue.userConfirmed ? "✓ You confirmed this issue" : "I am experiencing this issue"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={issue.userUpvoted}
              onClick={() => {
                void upvoteIssue(issue.id).then(() => {
                  toast("Support added.", "success");
                  refresh();
                });
              }}
            >
              <Icon name="thumb_up" className="text-[17px] align-[-4px]" /> Support ({issue.upvotes})
            </Button>
          </section>

          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
            <h2 className="text-headline-sm font-bold text-primary">Location</h2>
            <div className="rounded-lg border border-outline-variant/60 overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-surface-container">
                <ProjectMap projects={[]} selectedId={null} />
                <div
                  className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-none"
                  style={{ left: "45%", top: "60%" }}
                >
                  <Icon name="location_on" className="text-[34px] text-error drop-shadow" />
                </div>
              </div>
            </div>
            <div className="text-body-sm">
              <span className="text-on-surface-variant">Ward: </span>
              <strong className="text-primary">{issue.ward}</strong>
            </div>
            <div className="hidden">
              <MapLegend />
            </div>
          </section>

          {issue.projectId ? (
            <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-2">
              <h2 className="text-headline-sm font-bold text-primary">Related Project</h2>
              <RelatedProjectMini issue={issue} />
            </section>
          ) : null}

          {issue.confirmers.length > 0 ? (
            <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
              <h2 className="text-headline-sm font-bold text-primary">Recent Confirmations</h2>
              <ConfirmationList issue={issue} />
            </section>
          ) : null}
        </div>
      </div>

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title={lightbox?.name ?? ""}>
        <div className="p-6">
          <div className={`rounded-lg border border-outline-variant bg-gradient-to-br ${TONES[lightbox?.tone ?? ""] ?? TONES.roads} h-64 flex flex-col items-center justify-center gap-2`}>
            <Icon name="image" className="text-[56px] text-primary-container/50" />
            <span className="font-mono text-label-md text-primary">{lightbox?.name}</span>
            <span className="text-label-sm text-on-surface-variant text-center px-4">{lightbox?.meta}</span>
          </div>
        </div>
      </Modal>

      <span className="hidden">{communityIssueRoute("")}</span>
    </div>
  );
}
