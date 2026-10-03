import { useState } from "react";
import { useLocation } from "@/app/router";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/hooks/useT";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/components/common/Icon";
import type { Language } from "@/types/user";
import { LANGUAGES, LANGUAGE_ORDER } from "@/constants/i18n";

interface NavItem {
  id: string;
  labelKey: "nav.home" | "nav.projects" | "nav.complaints" | "nav.community" | "nav.alerts";
  icon: string;
  route: string;
  match: (path: string) => boolean;
  alertsBadge?: boolean;
}

function useNavItems(): NavItem[] {
  return [
    { id: "home", labelKey: "nav.home", icon: "home", route: ROUTES.HOME, match: (p) => p === "/home" || p === "/" },
    { id: "projects", labelKey: "nav.projects", icon: "travel_explore", route: ROUTES.PROJECTS, match: (p) => p.startsWith("/projects") },
    { id: "complaints", labelKey: "nav.complaints", icon: "receipt_long", route: ROUTES.COMPLAINTS, match: (p) => p.startsWith("/complaints") },
    { id: "community", labelKey: "nav.community", icon: "groups", route: ROUTES.COMMUNITY, match: (p) => p.startsWith("/community") },
    { id: "alerts", labelKey: "nav.alerts", icon: "notifications_active", route: ROUTES.ALERTS, match: (p) => p.startsWith("/alerts"), alertsBadge: true }
  ];
}

export function DesktopNav({ unreadAlerts }: { unreadAlerts: number }): JSX.Element {
  const { path } = useLocation();
  const { t } = useT();
  const items = useNavItems();
  return (
    <>
      {items.map((item) => {
        const active = item.match(path);
        return (
          <li key={item.id}>
            <a
              href={item.route}
              aria-current={active ? "page" : "false"}
              className={`relative flex items-center gap-2 px-3 py-2.5 my-1 rounded-lg text-[13.5px] tracking-wide transition-all duration-150 ${
                active
                  ? "bg-primary-container/10 text-primary font-bold shadow-xs border border-primary-container/20"
                  : "text-on-surface-variant font-semibold hover:text-primary hover:bg-surface-container/60"
              }`}
            >
              <Icon
                name={item.icon}
                className={`text-[19px] transition-transform duration-150 ${
                  active ? "text-secondary scale-105" : "text-on-surface-variant"
                }`}
              />
              <span>{t(item.labelKey)}</span>
              {item.alertsBadge && unreadAlerts > 0 ? (
                <span className="ml-1 inline-flex items-center justify-center min-w-[19px] h-[19px] px-1.5 rounded-full bg-error text-on-error text-[10px] font-extrabold shadow-xs">
                  {unreadAlerts}
                </span>
              ) : null}
              {active ? (
                <span className="absolute -bottom-1 inset-x-3 h-[2px] bg-secondary rounded-full" />
              ) : null}
            </a>
          </li>
        );
      })}
    </>
  );
}

export function LanguageMenu(): JSX.Element {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative hidden sm:block">
      <button
        className="hover:text-primary font-semibold flex items-center gap-1 px-1.5 py-1.5 rounded hover:bg-surface-container"
        aria-label="Switch language"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="translate" className="text-[16px] text-on-surface-variant" />
        <span className="text-label-sm font-label-sm">{LANGUAGES[auth.lang]}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant shadow-pop rounded-lg py-1 w-40 z-[60]">
          {LANGUAGE_ORDER.map((lang: Language) => (
            <button
              key={lang}
              className={`w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container-low ${
                lang === auth.lang ? "font-bold text-primary" : "text-on-surface-variant"
              }`}
              onClick={() => {
                auth.setLang(lang);
                setOpen(false);
              }}
            >
              {LANGUAGES[lang]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
