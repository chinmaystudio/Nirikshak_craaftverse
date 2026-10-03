import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/StatCard";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { ComplaintStepper, ComplaintTimeline } from "@/components/complaints/ComplaintTimeline";
import { SlaPanel, EscalationPath } from "@/components/complaints/SLAIndicator";
import { EvidenceGallery, OfficerCard, ResolutionPanel, FeedbackPanel, PriorityChips, RelatedProjectLink } from "@/components/complaints/ComplaintCard";
import { useNavigate, useLocation, getRouteId } from "@/app/router";
import { useAsync } from "@/hooks/useAsync";
import { useAppState } from "@/app/providers/store";
import { toast } from "@/hooks/useToast";
import type { Complaint } from "@/types/complaint";
import { getComplaint, addEvidence, reopenComplaint, escalateComplaint, markResolved, submitFeedback } from "@/services/complaints/complaintsService";
import { formatFileSize } from "@/utils/validation";
import { shortDate } from "@/utils/formatDate";

export function ComplaintDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const { query } = useLocation();
  const id = getRouteId();
  const justCreated = query.created === "1";
  const state = useAsync<Complaint>(() => getComplaint(id), [id]);

  const [confirmAction, setConfirmAction] = useState<"reopen" | "escalate" | "verify" | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  if (state.loading) return <LoadingSkeleton kind="detail" />;
  if (state.error || !state.data) {
    return <ErrorState notFound={state.notFound} message={state.error ?? "Complaint not found."} onRetry={state.notFound ? undefined : state.reload} />;
  }

  const complaint = state.data;
  const closed = complaint.status === "resolved" || complaint.status === "closed";
  const breached = complaint.sla?.deadline ? (Number(complaint.sla.deadline) - Date.now() <= 0) : false;
  const createdComplaint = useCreatedComplaint(complaint.id);

  const refresh = (): void => {
    state.reload();
  };

  const guardError = (e: Error): void => toast(e.message, "info");

  const actions: JSX.Element[] = [];
  if (closed) {
    actions.push(
      <Button key="reopen" variant="outline" icon="restart_alt" onClick={() => setConfirmAction("reopen")}>
        Reopen
      </Button>
    );
    if (!complaint.feedback) {
      actions.push(
        <Button key="feedback" icon="reviews" onClick={() => setFeedbackOpen(true)}>
          Give Feedback
        </Button>
      );
    }
  } else {
    actions.push(
      <label key="evidence" className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f || !createdComplaint) {
              toast("Demo ledger complaints cannot be modified — file a new complaint in this session to try actions.", "info");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              void addEvidence(complaint.id, { id: crypto.randomUUID(), name: f.name, size: formatFileSize(f.size), kind: "image", meta: "Citizen-uploaded evidence", thumb: String(reader.result) }).then(() => {
                toast("Evidence added to the case file.", "success");
                refresh();
              });
            };
            reader.readAsDataURL(f);
          }}
        />
        <span className="inline-flex items-center justify-center gap-1.5 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container bg-transparent px-4 py-2 text-label-md font-bold cursor-pointer">
          <Icon name="add_a_photo" className="text-[17px]" /> Add Evidence
        </span>
      </label>
    );
    if (complaint.status === "action-taken") {
      actions.push(
        <Button key="verify" variant="success" icon="task_alt" onClick={() => setConfirmAction("verify")}>
          Mark Issue Resolved
        </Button>
      );
    }
    if (breached || complaint.status === "escalated" || complaint.status === "action-taken") {
      actions.push(
        <Button key="escalate" variant="danger" icon="arrow_upward" disabled={complaint.status === "escalated"} onClick={() => setConfirmAction("escalate")}>
          {complaint.status === "escalated" ? "Escalated" : "Escalate"}
        </Button>
      );
    }
  }

  const runConfirm = (): void => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    const handleError = guardError;
    if (action === "reopen") {
      void reopenComplaint(complaint.id, "Citizen reported the issue persists after closure.")
        .then(() => {
          toast("Complaint reopened with a fresh 24-hour SLA.", "success");
          refresh();
        })
        .catch(handleError);
    } else if (action === "escalate") {
      void escalateComplaint(complaint.id)
        .then(() => {
          toast("Complaint escalated. The oversight cell has been notified.", "success");
          refresh();
        })
        .catch(handleError);
    } else if (action === "verify") {
      void markResolved(complaint.id)
        .then(() => {
          toast("Thank you for verifying. Resolution recorded.", "success");
          refresh();
        })
        .catch(handleError);
    }
  };

  return (
    <div className="space-y-6">
      {justCreated ? (
        <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 p-4 rounded-lg flex items-start gap-3">
          <Icon name="check_circle" className="text-[22px] text-green-700 flex-shrink-0" />
          <div className="text-body-sm text-on-surface">
            <strong className="text-green-800">Complaint lodged successfully.</strong> AI verification is complete and the case has entered the
            departmental queue. Keep this reference handy: <span className="font-mono font-bold">{complaint.id}</span>
          </div>
        </div>
      ) : null}

      <PageHeader title={complaint.id} sub={complaint.title} back onBack={() => navigate("/complaints")} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <PriorityChips complaint={complaint} />
                <h2 className="text-headline-md font-bold text-primary mt-2 max-w-2xl">{complaint.title}</h2>
              </div>
              <div className="text-right text-label-sm text-outline flex-shrink-0">
                <div>Filed {shortDate(complaint.submittedAt)}</div>
                <div>Last update {shortDate(complaint.updatedAt)}</div>
              </div>
            </div>
            <p className="text-body-md text-on-surface-variant">{complaint.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30">
                <span className="text-on-surface-variant">Location: </span>
                <strong className="text-primary">{complaint.location}</strong>
              </div>
              <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30">
                <span className="text-on-surface-variant">Ward: </span>
                <strong className="text-primary">{complaint.ward}</strong>
              </div>
            </div>
            <RelatedProjectLink complaint={complaint} />
            <div>
              <h3 className="text-label-md font-bold text-primary mb-2">Evidence attached</h3>
              <EvidenceGallery items={complaint.evidence} />
            </div>
          </section>

          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
            <h2 className="text-headline-sm font-bold text-primary">Investigation Lifecycle</h2>
            <ComplaintStepper complaint={complaint} />
          </section>

          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-4">
            <h2 className="text-headline-sm font-bold text-primary">Case Timeline</h2>
            <ComplaintTimeline complaint={complaint} />
          </section>

          {complaint.officerNote ? (
            <section className="bg-surface-container-low p-5 rounded-lg text-body-sm space-y-2 border border-outline-variant/30">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Icon name="engineering" className="text-[18px] text-secondary" /> Official Redressal Officer Note:
              </div>
              <p className="text-on-surface-variant italic">{complaint.officerNote}</p>
            </section>
          ) : null}

          <ResolutionPanel complaint={complaint} />
          <FeedbackPanel complaint={complaint} />
        </div>

        <div className="lg:col-span-4 space-y-5">
          <SlaPanel complaint={complaint} />
          <EscalationPath complaint={complaint} />
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
            <h2 className="text-headline-sm font-bold text-primary">Actions</h2>
            <div className="flex flex-wrap gap-2">{actions}</div>
            <p className="text-label-sm text-outline">
              Actions update the public case file instantly. Misuse is auditable under the declaration you signed.
            </p>
          </section>
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
            <h2 className="text-headline-sm font-bold text-primary">Assigned Authority</h2>
            <OfficerCard complaint={complaint} />
            <div className="text-body-sm">
              <span className="text-on-surface-variant">Department: </span>
              <strong className="text-primary">{complaint.department}</strong>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "reopen"}
        title="Reopen this complaint?"
        text="The issue persists after the department's closure. It will re-enter the active queue with a fresh 24-hour SLA."
        okLabel="Reopen Complaint"
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirmAction === "escalate"}
        title="Escalate to higher authority?"
        text="Your complaint will be flagged to the department head and the Municipal Commissioner's oversight list with the full case file."
        okLabel="Escalate Now"
        icon="arrow_upward"
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirm}
      />
      <ConfirmDialog
        open={confirmAction === "verify"}
        title="Confirm the issue is resolved?"
        text="Marking it resolved confirms the department's action on the ground. You can reopen it later if the problem returns."
        okLabel="Yes, It's Fixed"
        icon="task_alt"
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirm}
      />

      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Rate the redressal">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} aria-label={`${i} star`}>
                <Icon name="star" className={`text-[32px] ${i <= rating ? "text-secondary" : "text-outline-variant"}`} />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Optional: what went well or what should improve?"
            className="w-full px-3 py-2 border border-outline-variant rounded text-body-md"
          />
          <div className="flex justify-end gap-2">
            <Button variant="soft" onClick={() => setFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={rating === 0}
              onClick={() => {
                if (!createdComplaint) {
                  toast("Demo ledger complaints cannot be modified — file a new complaint in this session to try actions.", "info");
                  setFeedbackOpen(false);
                  return;
                }
                void submitFeedback(complaint.id, { rating, comment: feedbackText.trim(), at: new Date().toISOString() }).then(() => {
                  setFeedbackOpen(false);
                  toast("Feedback recorded. Thank you for keeping the system accountable.", "success");
                  refresh();
                });
              }}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function useCreatedComplaint(id: string): Complaint | null {
  const created = useAppState((s) => s.created);
  return created.find((c) => c.id === id) ?? null;
}
