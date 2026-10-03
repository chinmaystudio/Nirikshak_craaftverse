import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { StatCard, PageHeader } from "@/components/common/StatCard";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { useAppState } from "@/app/providers/store";
import { useT } from "@/hooks/useT";
import { toast } from "@/hooks/useToast";
import { LANGUAGES } from "@/constants/i18n";
import { shortDate } from "@/utils/formatDate";

export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const { t } = useT();
  const user = auth.user;
  const complaintsState = useComplaints();
  const vision = useAppState((s) => s.vision);
  const confirmed = useAppState((s) => s.confirmed);

  if (!user) return <></>;

  const resolved = complaintsState.complaints.filter((c) => c.status === "resolved" || c.status === "closed").length;

  const cell = (icon: string, k: string, v: string): JSX.Element => (
    <div className="py-3 sm:py-4 flex items-start gap-3">
      <span className="w-9 h-9 rounded-full bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
        <Icon name={icon} className="text-[18px]" />
      </span>
      <div>
        <dt className="text-label-sm text-on-surface-variant">{k}</dt>
        <dd className="text-body-md font-semibold text-primary">{v}</dd>
      </div>
    </div>
  );

  const linkRow = (route: string, icon: string, title: string, sub: string): JSX.Element => (
    <a href={route} className="flex items-center gap-3 p-4 hover:bg-surface-container-low transition-colors">
      <span className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <span className="flex-1">
        <span className="block text-label-md font-bold text-primary">{title}</span>
        <span className="block text-body-sm text-on-surface-variant">{sub}</span>
      </span>
      <Icon name="chevron_right" className="text-[20px] text-outline" />
    </a>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="My Profile" sub="Your citizen identity on the NIRIKSHAK transparency network." />

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="bg-primary-container text-on-primary p-6 flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-headline-md font-bold">
            {user.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-headline-md font-bold">{user.name}</h2>
              {user.verified ? (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-label-sm font-bold flex items-center gap-1">
                  <Icon name="verified" className="text-[14px]" /> OTP Verified
                </span>
              ) : null}
            </div>
            <div className="text-body-sm text-surface-variant">Citizen Auditor • {user.ward}</div>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 p-6">
          {cell("call", "Mobile Number", `+91 ${user.mobile}`)}
          {cell("mail", "Email", user.email ?? "Not provided")}
          {cell("location_on", "City / Ward", `${user.city} • ${user.ward}`)}
          {cell("translate", "Preferred Language", LANGUAGES[user.preferredLanguage])}
          {cell("calendar_today", "Member Since", shortDate(user.joinedAt))}
          {cell("fingerprint", "Identity Mode", "Supabase email account")}
        </dl>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Complaints Filed" value={complaintsState.complaints.length} sub="All time" icon="receipt_long" />
        <StatCard label="Active" value={complaintsState.activeCount} sub="In SLA pipeline" icon="pending_actions" />
        <StatCard label="Resolved" value={resolved} sub="Redressal verified" icon="task_alt" circleClass="bg-green-100 text-green-800" />
        <StatCard label="Vision Checks" value={vision.length} sub={`${confirmed.length} community confirmations`} icon="photo_camera" />
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm divide-y divide-outline-variant/30">
        {linkRow("#/complaints", "receipt_long", "My Complaints", "Track SLA status, reopen or escalate")}
        {linkRow("/user/vision/history", "photo_camera", "My Infrastructure Checks", "Reopen NIRIKSHAK Vision results")}
        {linkRow("#/settings", "settings", "Settings", "Notifications, language and accessibility")}
        {linkRow("/user/report", "report", "Report a New Issue", "Guided flow with AI-assisted classification")}
      </section>

      <div className="flex justify-center pt-2 pb-6">
        <Button
          variant="danger"
          size="lg"
          icon="logout"
          onClick={() => {
            void auth.logout().then(() => {
              toast("You have been signed out.", "info");
              navigate("#/home");
            });
          }}
        >
          Logout from this device
        </Button>
      </div>
      <span className="hidden">{t("nav.home")}</span>
    </div>
  );
}
