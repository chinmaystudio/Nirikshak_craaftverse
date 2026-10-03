import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ComplaintTableRow, ComplaintMobileCard } from "@/components/complaints/ComplaintCard";
import { useNavigate } from "@/app/router";
import { useComplaints } from "@/hooks/useComplaints";
import { useAuth } from "@/hooks/useAuth";
import { COMPLAINT_FILTERS } from "@/constants/complaintStatuses";
import { ROUTES } from "@/constants/routes";
import type { Complaint } from "@/types/complaint";

export function MyComplaintsPage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const { loading, error, complaints, reload } = useComplaints();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered: Complaint[] = complaints.filter((c) => {
    if (filter === "active" && (c.status === "resolved" || c.status === "closed")) return false;
    if (!["all", "active"].includes(filter) && c.status !== filter) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!`${c.id} ${c.title} ${c.department} ${c.categoryLabel}`.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  if (!auth.isLoggedIn) return <></>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        sub="Live status, SLA countdowns and escalation tracking for every issue you have reported."
        actions={
          <Button variant="accent" icon="add_circle" onClick={() => navigate(ROUTES.REPORT)}>
            Lodge New Grievance
          </Button>
        }
      />

      <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <Icon name="manage_search" className="text-secondary text-[28px] flex-shrink-0" />
        <div className="flex-grow w-full">
          <label htmlFor="c-search" className="block text-label-sm text-on-surface-variant mb-1">
            Track a specific complaint reference number
          </label>
          <input
            id="c-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, title or department…"
            className="w-full px-3 py-2 border border-outline-variant rounded font-mono text-body-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {COMPLAINT_FILTERS.map((f) => {
          const count =
            f.id === "all"
              ? complaints.length
              : f.id === "active"
                ? complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length
                : complaints.filter((c) => c.status === f.id).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-label-sm font-label-sm font-bold border transition-colors ${
                active ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton kind="table" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        complaints.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No complaints yet"
            text="Your submitted complaints will appear here with live SLA tracking."
            ctaLabel="Report an Issue"
            ctaRoute={ROUTES.REPORT}
          />
        ) : (
          <EmptyState icon="filter_alt_off" title="No complaints in this view" text="Adjust the status filter or search to see more." />
        )
      ) : (
        <>
          <div className="hidden lg:block bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-primary-container text-on-primary text-label-sm">
                    <th className="p-3">Ticket ID</th>
                    <th className="p-3">Issue</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">SLA</th>
                    <th className="p-3">Filed</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filtered.map((c) => (
                    <ComplaintTableRow key={c.id} complaint={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:hidden space-y-3">
            {filtered.map((c) => (
              <ComplaintMobileCard key={c.id} complaint={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
