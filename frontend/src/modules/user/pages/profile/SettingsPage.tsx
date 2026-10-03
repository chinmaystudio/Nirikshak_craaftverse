import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/StatCard";
import { ConfirmDialog } from "@/components/common/Modal";
import { useState } from "react";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { appStore, useAppState } from "@/app/providers/store";
import { toast } from "@/hooks/useToast";
import { downloadText } from "@/utils/download";
import { WARDS } from "@/constants/issueCategories";
import { LANGUAGES } from "@/constants/i18n";
import { ROUTES } from "@/constants/routes";

export function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const settings = auth.settings;
  const vision = useAppState((s) => s.vision);
  const created = useAppState((s) => s.created);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!auth.user) return <></>;

  const toggleRow = (id: keyof typeof settings, title: string, sub: string): JSX.Element => (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <div className="text-label-md font-bold text-primary">{title}</div>
        <div className="text-body-sm text-on-surface-variant">{sub}</div>
      </div>
      <button
        role="switch"
        aria-checked={settings[id]}
        onClick={() => {
          auth.updateSettings({ [id]: !settings[id] });
          toast("Preference saved.", "success");
        }}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${settings[id] ? "bg-green-600" : "bg-outline-variant"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings[id] ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Settings" sub="Notification, language and accessibility preferences for your citizen account." />

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm">
        <div className="px-4 pt-4 flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
            <Icon name="notifications" className="text-[20px]" />
          </span>
          <h2 className="text-headline-sm font-bold text-primary">Notifications</h2>
        </div>
        <div className="divide-y divide-outline-variant/30 mt-2 pb-2">
          {toggleRow("alerts", "Project & Safety Alerts", "Critical infrastructure alerts and road closures in your wards")}
          {toggleRow("sla", "SLA Breach Warnings", "Notify me the moment a department misses my complaint deadline")}
          {toggleRow("community", "Community Activity", "Replies and government responses on issues I follow")}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm">
        <div className="px-4 pt-4 flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
            <Icon name="translate" className="text-[20px]" />
          </span>
          <h2 className="text-headline-sm font-bold text-primary">Language & Region</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-lang" className="block text-label-md font-label-md text-primary mb-1">
              Portal Language
            </label>
            <select
              id="set-lang"
              value={auth.lang}
              onChange={(e) => {
                auth.setLang(e.target.value as typeof auth.lang);
                toast("Language updated.", "success");
              }}
              className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
            >
              {Object.entries(LANGUAGES).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-label-sm text-outline mt-1">Interface strings. More languages can be added by extending the i18n dictionary.</p>
          </div>
          <div>
            <label htmlFor="set-ward" className="block text-label-md font-label-md text-primary mb-1">
              Default Ward
            </label>
            <select
              id="set-ward"
              value={auth.user.ward}
              onChange={(e) => {
                void import("@/services/auth/authService").then(({ updateProfile }) =>
                  updateProfile({ ward: e.target.value }).then(() => toast("Default ward updated.", "success"))
                );
              }}
              className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
            >
              {WARDS.filter((w) => w !== "All Pune").map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm">
        <div className="px-4 pt-4 flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center">
            <Icon name="accessibility_new" className="text-[20px]" />
          </span>
          <h2 className="text-headline-sm font-bold text-primary">Accessibility</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-label-md font-bold text-primary mb-1">Text size</div>
            <div className="flex items-center gap-2">
              <Button variant="soft" onClick={() => auth.setFontScale(Math.max(85, auth.fontScale - 10))}>
                A−
              </Button>
              <Button variant="outline" onClick={() => auth.setFontScale(100)}>
                A
              </Button>
              <Button variant="soft" onClick={() => auth.setFontScale(Math.min(125, auth.fontScale + 10))}>
                A+
              </Button>
              <span className="text-label-sm text-outline ml-2">
                Current: <span className="font-mono font-bold text-primary">{auth.fontScale}%</span> — synced across the portal.
              </span>
            </div>
          </div>
          <div className="p-3 bg-surface-container-low rounded text-label-sm text-on-surface-variant">
            The portal targets GIGW 3.0 and WCAG 2.1 AA: keyboard operability, skip links, contrast and screen-reader landmarks are built in.
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm">
        <div className="px-4 pt-4 flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-surface-container text-error flex items-center justify-center">
            <Icon name="shield_lock" className="text-[20px]" />
          </span>
          <h2 className="text-headline-sm font-bold text-primary">Data & Privacy</h2>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            icon="download"
            onClick={() => {
              downloadText("nirikshan-my-data.json", JSON.stringify({ profile: auth.user, complaints: created, vision, settings }, null, 2), "application/json");
              toast("Your portable data export has been downloaded.", "success");
            }}
          >
            Download My Data
          </Button>
          <Button variant="danger" icon="delete_forever" onClick={() => setDeleteOpen(true)}>
            Delete Account & Local Data
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        danger
        title="Delete account and local data?"
        text="This clears your demo profile, complaint drafts and preferences stored on this device. Filed complaints on the public ledger are retained under the records policy."
        okLabel="Delete Everything"
        icon="delete_forever"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          appStore.resetSession();
          toast("Local demo data cleared. Session ended.", "info");
          navigate(ROUTES.LOGIN);
        }}
      />
    </div>
  );
}
