import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { ComplaintStatusBadge } from "@/components/common/StatusBadge";
import { useAppState } from "@/app/providers/store";
import { useNavigate } from "@/app/router";
import { ROUTES } from "@/constants/routes";

export function ReportSuccessPage(): JSX.Element {
  const navigate = useNavigate();
  const lastSubmitted = useAppState((s) => s.lastSubmitted);

  if (!lastSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <EmptyState
          icon="task_alt"
          title="No recent submission"
          text="File a complaint and its confirmation with tracking ID will appear here."
          ctaLabel="Report an Issue"
          ctaRoute={ROUTES.REPORT}
        />
      </div>
    );
  }

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
            <div className="font-mono text-headline-md font-bold text-primary mt-1">{lastSubmitted}</div>
            <div className="text-label-sm text-outline mt-1">An SMS confirmation has been triggered to your registered mobile.</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="accent" icon="receipt_long" onClick={() => navigate(`/complaints/${lastSubmitted}?created=1`)}>
              Track Complaint
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.COMPLAINTS)}>
              My Complaints
            </Button>
            <Button variant="soft" onClick={() => navigate(ROUTES.HOME)}>
              Back to Home
            </Button>
          </div>
          <div className="flex justify-center">
            <ComplaintStatusBadge status="under-review" />
          </div>
        </div>
      </div>
    </div>
  );
}
