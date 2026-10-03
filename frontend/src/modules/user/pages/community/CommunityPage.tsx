import { useState } from "react";
import { Button } from "@/components/common/Button";
import { StatCard, PageHeader } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { CommunityIssueCard } from "@/components/community/CommunityIssueCard";
import { ConfirmDialog } from "@/components/common/Modal";
import { Icon } from "@/components/common/Icon";
import { useNavigate } from "@/app/router";
import { toast } from "@/hooks/useToast";
import { useCommunityFeed, useCommunityActions } from "@/hooks/useCommunity";
import { ROUTES } from "@/constants/routes";
import { formatNumber } from "@/utils/formatCurrency";
import type { CommunityFeed } from "@/services/community/communityService";

const FEEDS: Array<{ id: CommunityFeed; label: string }> = [
  { id: "nearby", label: "Nearby Issues" },
  { id: "trending", label: "Trending" },
  { id: "recent", label: "Recently Reported" },
  { id: "supported", label: "Most Supported" },
  { id: "resolved", label: "Resolved" }
];

export function CommunityPage(): JSX.Element {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<CommunityFeed>("nearby");
  const state = useCommunityFeed(feed);
  const { confirm } = useCommunityActions();
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const stats = state.data?.stats;
  const issues = state.data?.issues ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Issues"
        sub="Civic participation built on verification — confirm what you have seen, support what matters, and watch departments respond in public."
        actions={
          <Button variant="accent" icon="add_circle" onClick={() => navigate(ROUTES.REPORT)}>
            Report an Issue
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Issues" value={stats?.open ?? "—"} sub="Awaiting department action" icon="report_problem" circleClass="bg-amber-100 text-amber-900" />
        <StatCard label="Resolved" value={stats?.resolved ?? "—"} sub="Verified by citizens" icon="verified" circleClass="bg-green-100 text-green-800" />
        <StatCard label="Citizen Confirmations" value={stats ? formatNumber(stats.confirmations) : "—"} sub="Ground-truth verifications" icon="how_to_reg" />
        <StatCard label="Citizens Affected" value={stats ? formatNumber(stats.citizensAffected) : "—"} sub="Across tracked issues" icon="groups" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 border-b border-outline-variant/30">
        {FEEDS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFeed(f.id)}
            className={`px-3.5 py-1.5 rounded text-label-md font-label-md whitespace-nowrap transition-colors ${
              feed === f.id ? "bg-primary text-on-primary font-bold" : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {state.loading ? (
        <LoadingSkeleton kind="list" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : issues.length === 0 ? (
        <EmptyState
          icon="celebration"
          title="Nothing here yet"
          text={feed === "resolved" ? "No resolved community issues in this filter yet." : "No issues match this filter right now."}
          ctaLabel="Report an Issue"
          ctaRoute={ROUTES.REPORT}
        />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <CommunityIssueCard key={issue.id} issue={issue} onConfirm={(id) => setConfirmTarget(id)} />
          ))}
        </div>
      )}

      <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 text-body-sm text-on-surface-variant flex items-start gap-2">
        <Icon name="shield" className="text-[20px] text-primary flex-shrink-0" />
        <span>
          <strong className="text-primary">Civic, not social.</strong> Confirmations are tied to ward residency and used as official evidence in
          departmental reviews. Personal details of reporters are never published.
        </span>
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Confirm this issue?"
        text="Your confirmation strengthens the community evidence pack shared with the department."
        okLabel="Confirm Issue"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            void confirm(confirmTarget).then(() => toast("Confirmation recorded — thank you for strengthening civic evidence.", "success"));
          }
          setConfirmTarget(null);
          void state.reload();
        }}
      />
    </div>
  );
}

