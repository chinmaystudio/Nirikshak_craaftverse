import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ComplaintStatusBadge } from "@/components/common/StatusBadge";
import { ReportStepper, wizardTitle, wizardSub, SummaryRow } from "@/components/report/ReportStepper";
import { IssueCategoryGrid } from "@/components/report/IssueCategoryGrid";
import { LocationPicker } from "@/components/report/LocationPicker";
import { EvidenceUploader } from "@/components/report/EvidenceUploader";
import { AIVerification } from "@/components/report/AIVerification";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "@/hooks/useToast";
import { createComplaint } from "@/services/complaints/complaintsService";
import { analyzeReport } from "@/services/reporting/reportingService";
import { projectsData } from "@/services/projects/projectsService";
import { issueCategoryMeta } from "@/constants/issueCategories";
import { PRIORITY_META } from "@/constants/complaintStatuses";
import { consumeReportPrefill } from "@/features/reporting/reportFlow";
import { isRequired } from "@/utils/validation";
import { ROUTES } from "@/constants/routes";
import type { ReportDraft, EvidenceDraftItem } from "@/types/report";

function initialDraft(projectParam: string | null): ReportDraft {
  const draft: ReportDraft = {
    step: 0,
    categoryId: null,
    title: "",
    description: "",
    priority: "medium",
    projectId: projectParam ?? "",
    address: "",
    ward: "",
    gps: null,
    pin: null,
    evidence: [],
    aiResult: null,
    submittedId: null,
    submitting: false
  };
  return draft;
}

export function ReportIssuePage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const { projects } = useProjects();
  const projectParam = new URLSearchParams(window.location.search).get("project");
  const [draft, setDraft] = useState<ReportDraft>(() => {
    const d = initialDraft(projectParam);
    d.ward = auth.user?.ward ?? "Ward 12 — Kothrud West";
    const prefill = consumeReportPrefill();
    if (prefill) {
      d.categoryId = prefill.categoryId;
      d.priority = issueCategoryMeta(prefill.categoryId).priority;
      if (prefill.projectId) d.projectId = prefill.projectId;
      d.evidence = prefill.imageThumb
        ? [
            {
              id: `ev-vision-${prefill.analysisId}`,
              name: "vision_capture.jpg",
              size: "1.2 MB",
              kind: "image",
              thumb: prefill.imageThumb,
              meta: `NIRIKSHAK Vision • ${prefill.summary}`,
              fromVision: true
            }
          ]
        : [];
      d.title = prefill.summary.split(" — ")[0] + " issue";
      d.step = 1;
      window.setTimeout(() => toast("Photo and details prefilled from NIRIKSHAK Vision — review and submit.", "success"), 100);
    }
    return d;
  });
  const [aiStep, setAiStep] = useState(0);
  const [aiRunning, setAiRunning] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [locationPrefill, setLocationPrefill] = useState<{ address: string; ward: string; gps: string | null } | null>(
    (() => {
      const raw = sessionStorage.getItem("nirikshan.locationPrefill");
      if (raw) {
        sessionStorage.removeItem("nirikshan.locationPrefill");
        try {
          return JSON.parse(raw) as { address: string; ward: string; gps: string | null };
        } catch {
          return null;
        }
      }
      return null;
    })()
  );

  const patch = (p: Partial<ReportDraft>): void => setDraft((d) => ({ ...d, ...p }));

  const validate = (): boolean => {
    if (draft.step === 0 && draft.categoryId === null) {
      toast("Select the issue category that fits best.", "error");
      return false;
    }
    if (draft.step === 1) {
      if (!isRequired(draft.title, 8)) {
        toast("Give the issue a clear title (min 8 characters).", "error");
        return false;
      }
      if (!isRequired(draft.description, 20)) {
        toast("Describe the issue in at least 20 characters so engineers can act.", "error");
        return false;
      }
    }
    if (draft.step === 2 && !isRequired(draft.address, 5) && !draft.pin && !draft.gps) {
      toast("Add an address or drop a pin on the map.", "error");
      return false;
    }
    return true;
  };

  const next = (): void => {
    if (!validate()) return;
    if (draft.step === 4 && draft.aiResult === null) {
      toast("Run the AI analysis before continuing — it strengthens routing accuracy.", "info");
      return;
    }
    if (draft.step < 6) patch({ step: draft.step + 1 });
  };

  const prev = (): void => {
    if (draft.step > 0) patch({ step: draft.step - 1 });
  };

  const runAI = (): void => {
    setAiRunning(true);
    setAiStep(0);
    const tick = window.setInterval(() => setAiStep((s) => Math.min(s + 1, 3)), 700);
    void analyzeReport({
      categoryId: draft.categoryId ?? "other",
      title: draft.title,
      priority: draft.priority,
      projectId: draft.projectId || null
    }).then((result) => {
      window.clearInterval(tick);
      setAiStep(4);
      setAiRunning(false);
      patch({ aiResult: result });
    });
  };

  const submit = (): void => {
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    patch({ submitting: true });
    const cat = draft.categoryId ? issueCategoryMeta(draft.categoryId) : null;
    const locationText = draft.address + (draft.gps ? ` (GPS ${draft.gps})` : draft.pin ? " (map pin)" : "");
    void createComplaint({
      title: draft.title,
      category: draft.categoryId ?? "other",
      categoryLabel: cat?.label ?? "Other",
      priority: draft.priority,
      projectId: draft.projectId || null,
      department: draft.aiResult?.department ?? cat?.department ?? "Municipal Commissioner Office",
      ward: draft.ward,
      location: locationText,
      description: draft.description,
      evidence: draft.evidence.map((e: EvidenceDraftItem) => ({
        id: e.id,
        name: e.name,
        size: e.size,
        kind: e.kind,
        meta: e.meta ?? `GPS attached • ${new Date().toISOString().slice(0, 10)}`,
        tone: draft.categoryId ?? "other",
        thumb: e.thumb ?? null,
        fromVision: e.fromVision
      })),
      aiSeverity: draft.aiResult?.severity ?? null,
      aiConfidence: draft.aiResult?.confidence ?? null,
      aiProjectName: draft.aiResult?.projectId ? (projectsData.find((p) => p.id === draft.aiResult?.projectId)?.name ?? null) : null
    })
      .then((complaint) => {
        patch({ submitting: false, submittedId: complaint.id, step: 6 });
        toast(`Complaint ${complaint.id} submitted successfully.`, "success");
      })
      .catch((e: Error) => {
        patch({ submitting: false });
        toast(e.message || "Submission failed. Please try again.", "error");
      });
  };

  if (draft.submittedId) {
    return <ReportSuccessInline id={draft.submittedId} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(draft.projectId ? `/projects/${draft.projectId}` : ROUTES.HOME)}
          className="inline-flex items-center gap-1.5 text-primary font-label-md hover:text-secondary"
        >
          <Icon name="arrow_back" className="text-[20px]" /> Back
        </button>
        <span className="text-label-md text-outline">Step {Math.min(draft.step + 1, 6)} of 6</span>
      </div>
      <ReportStepper current={draft.step} />
      <section className="bg-surface-container-lowest p-5 md:p-7 rounded-xl border border-outline-variant/60 shadow-sm space-y-5">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">{wizardTitle(draft.step)}</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{wizardSub(draft.step)}</p>
        </div>

        {draft.step === 0 ? <IssueCategoryGrid selected={draft.categoryId} onSelect={(id) => patch({ categoryId: id, priority: issueCategoryMeta(id).priority })} /> : null}

        {draft.step === 1 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="f-title" className="block text-label-md font-label-md text-primary mb-1">
                Issue title <span className="text-error">*</span>
              </label>
              <input
                id="f-title"
                value={draft.title}
                maxLength={120}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="e.g. Deep pothole near bus stop causing accidents"
                className="w-full px-3 py-2 border border-outline-variant rounded text-body-md focus:ring-2 focus:ring-primary-container focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="f-desc" className="block text-label-md font-label-md text-primary mb-1">
                Detailed description <span className="text-error">*</span>
              </label>
              <textarea
                id="f-desc"
                rows={4}
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="What is wrong, since when, and how does it affect citizens?"
                className="w-full px-3 py-2 border border-outline-variant rounded text-body-md focus:ring-2 focus:ring-primary-container focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-priority" className="block text-label-md font-label-md text-primary mb-1">
                  Priority
                </label>
                <select
                  id="f-priority"
                  value={draft.priority}
                  onChange={(e) => patch({ priority: e.target.value as ReportDraft["priority"] })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
                >
                  <option value="critical">Critical (12h SLA)</option>
                  <option value="high">High (24h SLA)</option>
                  <option value="medium">Medium (48h SLA)</option>
                  <option value="low">Normal (72h SLA)</option>
                </select>
                <p className="text-label-sm text-outline mt-1">SLA window drives automatic escalation.</p>
              </div>
              <div>
                <label htmlFor="f-project" className="block text-label-md font-label-md text-primary mb-1">
                  Related project (if known)
                </label>
                <select
                  id="f-project"
                  value={draft.projectId}
                  onChange={(e) => patch({ projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
                >
                  <option value="">Not linked to a specific project</option>
                  {(projects.length > 0 ? projects : projectsData).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-label-sm text-outline mt-1">Linking helps AI match duplicates and route faster.</p>
              </div>
            </div>
          </div>
        ) : null}

        {draft.step === 2 ? (
          <div
            onBlur={() => {
              if (locationPrefill) {
                patch({ address: draft.address || locationPrefill.address, ward: locationPrefill.ward, gps: draft.gps ?? locationPrefill.gps });
                setLocationPrefill(null);
              }
            }}
          >
            <LocationPicker draft={draft} onChange={patch} />
          </div>
        ) : null}

        {draft.step === 3 ? <EvidenceUploader draft={draft} onChange={patch} /> : null}

        {draft.step === 4 ? <AIVerification stepIndex={aiStep} running={aiRunning} result={draft.aiResult} onRun={runAI} /> : null}

        {draft.step === 5 ? (
          <div className="space-y-4">
            <dl className="divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-lg overflow-hidden text-body-sm">
              <SummaryRow label="Category" value={draft.categoryId ? issueCategoryMeta(draft.categoryId).label : "Other"} />
              <SummaryRow label="Title" value={draft.title} />
              <SummaryRow label="Description" value={draft.description} />
              <SummaryRow label="Priority" value={`${draft.priority} (${PRIORITY_META[draft.priority].slaHours}h SLA)`} />
              <SummaryRow
                label="Location"
                value={draft.address + (draft.gps ? ` • GPS ${draft.gps}` : draft.pin ? " • map pin placed" : "")}
              />
              <SummaryRow label="Ward" value={draft.ward} />
              <SummaryRow
                label="Related project"
                value={draft.projectId ? (projectsData.find((x) => x.id === draft.projectId)?.name ?? "—") : "—"}
              />
              <SummaryRow label="Evidence" value={`${draft.evidence.length} file(s) attached`} />
              <SummaryRow label="Recommended department" value={draft.aiResult?.department ?? (draft.categoryId ? issueCategoryMeta(draft.categoryId).department : "Municipal Commissioner Office")} />
              {draft.aiResult ? (
                <SummaryRow
                  label="AI assessment"
                  value={`${draft.aiResult.severity} severity • ${draft.aiResult.confidence}% confidence${draft.aiResult.duplicates ? ` • ${draft.aiResult.duplicates} similar nearby` : ""}`}
                />
              ) : null}
            </dl>
            <label className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 rounded text-primary" />
              <span>
                I confirm the information and evidence are truthful, and I accept the{" "}
                <span className="text-secondary font-semibold underline">Terms of Service</span>. False reporting is liable for action under
                applicable law. <span className="text-error">*</span>
              </span>
            </label>
            {consentError ? <p className="text-body-sm text-error font-semibold">Please confirm the declaration before submitting.</p> : null}
          </div>
        ) : null}

        {draft.step === 6 && draft.submittedId ? null : (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline-variant/30">
            <span className="text-label-sm text-outline">Your draft stays on this device until you submit.</span>
            <div className="flex items-center gap-2 justify-end">
              {draft.step > 0 && draft.step < 5 ? (
                <Button variant="soft" onClick={prev}>
                  Previous
                </Button>
              ) : null}
              {draft.step === 5 ? (
                <Button variant="accent" icon="send" loading={draft.submitting} onClick={submit}>
                  Submit Complaint
                </Button>
              ) : (
                <Button onClick={draft.step === 4 ? runAI : next}>{draft.step === 4 ? (draft.aiResult ? "Continue" : "Skip to Continue") : draft.step === 3 ? "Continue to AI-Assisted Review" : "Next"}</Button>
              )}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}


function ReportSuccessInline({ id }: { id: string }): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="bg-green-600 text-white p-8 text-center space-y-2">
          <span className="inline-flex w-16 h-16 rounded-full bg-white/15 items-center justify-center">
            <Icon name="task_alt" className="text-[42px]" />
          </span>
          <h1 className="text-headline-lg font-bold">Complaint Submitted Successfully</h1>
          <p className="text-body-md opacity-90">Your report is now on the public accountability record.</p>
        </div>
        <div className="p-6 md:p-8 space-y-5">
          <div className="bg-surface-container-low p-4 rounded-lg text-center">
            <div className="text-label-md text-on-surface-variant">Your tracking reference</div>
            <div className="font-mono text-headline-md font-bold text-primary mt-1">{id}</div>
            <div className="text-label-sm text-outline mt-1">An SMS confirmation has been triggered to your registered mobile.</div>
          </div>
          <ol className="space-y-2.5 text-body-sm text-on-surface-variant list-decimal list-inside">
            <li>AI verification summary is attached to your case file.</li>
            <li>The concerned department picks up the complaint within the SLA window.</li>
            <li>You receive an officer assignment with inspection updates on this portal and by SMS.</li>
            <li>If the SLA is breached, the case is escalated automatically — nothing for you to chase.</li>
          </ol>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Button variant="accent" icon="receipt_long" onClick={() => navigate(`/complaints/${id}?created=1`)}>
              Track Complaint
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.COMPLAINTS)}>
              My Complaints
            </Button>
            <Button variant="soft" onClick={() => navigate(ROUTES.HOME)}>
              Back to Home
            </Button>
          </div>
          <div className="flex justify-center pt-2">
            <EmptyState
              icon="mark_email_read"
              title="What happens next?"
              text="Track the live SLA countdown, officer notes and resolution evidence from My Complaints."
            />
          </div>
          <div className="flex justify-center gap-2">
            <ComplaintStatusBadge status="under-review" />
          </div>
        </div>
      </div>
    </div>
  );
}
