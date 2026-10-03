import { useEffect, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { useLocation, navigate } from "@/app/router";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/hooks/useT";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";

interface DrawerItem {
  id: string;
  labelKey: "nav.home" | "nav.projects" | "nav.report" | "nav.complaints" | "nav.community" | "nav.alerts";
  icon: string;
  route: string;
  match: (path: string) => boolean;
}

export function MobileNavigation(): JSX.Element {
  const { path } = useLocation();
  const { t } = useT();
  const auth = useAuth();
  const { unreadCount } = useAlerts();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (): void => setOpen(true);
    document.addEventListener("nirikshan:open-drawer", handler);
    return () => document.removeEventListener("nirikshan:open-drawer", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  const drawerItems: DrawerItem[] = [
    { id: "d-home", labelKey: "nav.home", icon: "home", route: ROUTES.HOME, match: (p) => p === "/home" || p === "/" },
    { id: "d-projects", labelKey: "nav.projects", icon: "travel_explore", route: ROUTES.PROJECTS, match: (p) => p.startsWith("/projects") },
    { id: "d-report", labelKey: "nav.report", icon: "report_problem", route: ROUTES.REPORT, match: (p) => p.startsWith("/report") },
    { id: "d-complaints", labelKey: "nav.complaints", icon: "receipt_long", route: ROUTES.COMPLAINTS, match: (p) => p.startsWith("/complaints") },
    { id: "d-community", labelKey: "nav.community", icon: "groups", route: ROUTES.COMMUNITY, match: (p) => p.startsWith("/community") },
    { id: "d-alerts", labelKey: "nav.alerts", icon: "notifications_active", route: ROUTES.ALERTS, match: (p) => p.startsWith("/alerts") }
  ];

  const bottomItems: Array<{ id: string; labelKey: "nav.home" | "nav.projects" | "nav.report" | "nav.complaints" | "nav.alerts"; icon: string; route: string; match: (p: string) => boolean; center?: boolean; badge?: boolean }> = [
    { id: "b-home", labelKey: "nav.home", icon: "home", route: ROUTES.HOME, match: (p) => p === "/home" || p === "/" },
    { id: "b-projects", labelKey: "nav.projects", icon: "travel_explore", route: ROUTES.PROJECTS, match: (p) => p.startsWith("/projects") },
    { id: "b-report", labelKey: "nav.report", icon: "add_circle", route: ROUTES.REPORT, match: (p) => p.startsWith("/report"), center: true },
    { id: "b-complaints", labelKey: "nav.complaints", icon: "receipt_long", route: ROUTES.COMPLAINTS, match: (p) => p.startsWith("/complaints") },
    { id: "b-alerts", labelKey: "nav.alerts", icon: "notifications_active", route: ROUTES.ALERTS, match: (p) => p.startsWith("/alerts"), badge: true }
  ];

  return (
    <>
      {open ? (
        <>
          <div className="fixed inset-0 z-[75] bg-primary/50" onClick={() => setOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-[80] w-72 bg-surface-container-lowest shadow-pop flex flex-col view-enter"
            aria-label="Navigation menu"
          >
            <div className="bg-primary-container text-on-primary p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/95 px-2 py-1 rounded-md shadow-sm">
                  <img
                    src="/logo/nirikshak-logo.png"
                    alt="NIRIKSHAK"
                    className="h-7 w-auto object-contain"
                  />
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              {drawerItems.map((item) => {
                const active = item.match(path);
                return (
                  <a
                    key={item.id}
                    href={item.route}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded text-body-md ${
                      active
                        ? "bg-surface-container text-primary font-semibold border-l-4 border-secondary"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <Icon name={item.icon} className={`text-[20px] ${active ? "text-secondary" : "text-on-surface-variant"}`} />
                    {t(item.labelKey)}
                    {item.labelKey === "nav.alerts" && unreadCount > 0 ? (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    ) : null}
                  </a>
                );
              })}
              <a
                href={ROUTES.VISION}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-body-md bg-primary-container/5 text-primary font-semibold border border-primary-container/20"
              >
                <Icon name="photo_camera" className="text-[20px] text-secondary" /> Identify Infrastructure
              </a>
              <a
                href={ROUTES.ASSISTANT}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-body-md text-on-surface hover:bg-surface-container-low"
              >
                <Icon name="smart_toy" className="text-[20px] text-on-surface-variant" /> {t("assistant")}
              </a>
              <a
                href={ROUTES.SETTINGS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-body-md text-on-surface hover:bg-surface-container-low"
              >
                <Icon name="settings" className="text-[20px] text-on-surface-variant" /> Settings
              </a>
            </nav>
            <div className="p-3 border-t border-outline-variant/40">
              {auth.user ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    void auth.logout().then(() => {
                      navigate(ROUTES.HOME);
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded border border-error/40 text-error text-label-md font-label-md hover:bg-error-container/30"
                >
                  <Icon name="logout" className="text-[18px]" /> Logout
                </button>
              ) : (
                <a
                  href={ROUTES.LOGIN}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-primary-container text-on-primary text-label-md font-label-md font-bold"
                >
                  <Icon name="login" className="text-[18px]" /> {t("cta.login")}
                </a>
              )}
            </div>
          </aside>
        </>
      ) : null}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-surface-container-lowest border-t border-outline-variant" aria-label="Primary">
        <div className="grid grid-cols-5 items-end h-16">
          {bottomItems.map((item) => {
            const active = item.match(path);
            if (item.center) {
              return (
                <div key="report-center" className="flex justify-center">
                  <a
                    href={item.route}
                    className="-mt-6 w-14 h-14 rounded-full bg-secondary text-on-secondary shadow-pop flex items-center justify-center active:scale-95 transition-transform"
                    aria-label={t(item.labelKey)}
                  >
                    <Icon name={item.icon} className="text-[26px]" />
                  </a>
                </div>
              );
            }
            return (
              <a
                key={item.id}
                href={item.route}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1 ${active ? "text-secondary" : "text-on-surface-variant"}`}
              >
                {item.badge && unreadCount > 0 ? <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-error" /> : null}
                <Icon name={item.icon} className="text-[22px]" />
                <span className="text-[10px] font-semibold tracking-wide">{t(item.labelKey)}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
