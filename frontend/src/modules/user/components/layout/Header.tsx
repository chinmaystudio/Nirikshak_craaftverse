import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { useAlerts } from "@/hooks/useAlerts";
import { navigate } from "@/app/router";
import { ROUTES } from "@/constants/routes";
import { DesktopNav } from "./Navigation";
import { LanguageMenu } from "./Navigation";
import { RealtimeStatusIndicator } from "@/core/realtime/RealtimeStatusIndicator";

export function Header(): JSX.Element {
  const auth = useAuth();
  const { t } = useT();
  const { unreadCount } = useAlerts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const initials =
    auth.user
      ?.name.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  const submitSearch = (): void => {
    if (search.trim()) navigate(`${ROUTES.PROJECTS}?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="bg-surface-container-lowest sticky top-0 z-50 shadow-sm border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="drawer-open"
              className="lg:hidden p-1.5 rounded border border-outline-variant text-primary hover:bg-surface-container"
              aria-label="Open menu"
              onClick={() => {
                document.dispatchEvent(new CustomEvent("nirikshan:open-drawer"));
              }}
            >
              <Icon name="menu" />
            </button>
            <a className="flex items-center gap-3 group min-w-0" href={ROUTES.HOME} aria-label="NIRIKSHAK Home">
              <img
                src="/logo/nirikshak-logo.png"
                alt="NIRIKSHAK — Government Project Monitoring & Accountability Platform"
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/20">
                Citizen Portal
              </span>
            </a>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <RealtimeStatusIndicator className="hidden text-on-surface-variant xl:inline-flex" />
            <div className="hidden lg:flex items-center relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                }}
                className="w-64 xl:w-80 pl-9 pr-8 py-2 rounded-lg bg-surface border border-outline-variant/70 text-body-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all shadow-2xs"
                placeholder="Search projects by ID, city, or contractor…"
                type="text"
                aria-label="Search projects"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant/70 pointer-events-none text-[18px]">search</span>
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 text-outline hover:text-primary text-[14px]"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <LanguageMenu />

            {auth.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-outline-variant/40 hover:bg-surface-container transition-colors shadow-2xs"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary text-on-primary flex items-center justify-center text-label-md font-bold shadow-xs">
                    {initials}
                  </span>
                  <span className="hidden xl:block text-left">
                    <span className="block text-label-md font-label-md text-primary font-bold leading-tight">{auth.user.name}</span>
                    <span className="block text-label-sm font-label-sm text-outline leading-tight">{auth.user.ward}</span>
                  </span>
                  <Icon name="expand_more" className="text-[16px] text-on-surface-variant" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-full mt-1.5 bg-surface-container-lowest border border-outline-variant/80 shadow-pop rounded-xl py-1.5 w-60 z-[60]">
                    <div className="px-4 py-2.5 border-b border-outline-variant/30 mb-1">
                      <div className="text-label-md font-label-md font-bold text-primary">{auth.user.name}</div>
                      <div className="text-label-sm text-on-surface-variant font-mono mt-0.5">+91 {auth.user.mobile}</div>
                    </div>
                    <MenuLink icon="person" label="Profile" to={ROUTES.PROFILE} onGo={() => setMenuOpen(false)} />
                    <MenuLink icon="receipt_long" label="My Complaints" to={ROUTES.COMPLAINTS} onGo={() => setMenuOpen(false)} />
                    <MenuLink icon="photo_camera" label="My Infrastructure Checks" to={ROUTES.VISION_HISTORY} onGo={() => setMenuOpen(false)} />
                    <MenuLink icon="settings" label="Settings" to={ROUTES.SETTINGS} onGo={() => setMenuOpen(false)} />
                    <button
                      data-logout
                      onClick={() => {
                        setMenuOpen(false);
                        void auth.logout().then(() => {
                          navigate(ROUTES.HOME);
                        });
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-body-sm text-error hover:bg-error-container/40 border-t border-outline-variant/30 mt-1 transition-colors"
                    >
                      <Icon name="logout" className="text-[18px]" /> Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <a
                href={ROUTES.LOGIN}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.LOGIN);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary-container text-primary-container font-label-md text-label-md font-bold hover:bg-surface-container transition-colors shadow-2xs"
              >
                <Icon name="account_circle" className="text-[18px]" />
                <span>{t("cta.login")}</span>
              </a>
            )}

            <button
              onClick={() => navigate(ROUTES.REPORT)}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-[#b36200] hover:from-[#7a4200] hover:to-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm transition-all duration-150 active:scale-95"
            >
              <Icon name="campaign" className="text-[18px]" />
              <span>{t("cta.lodge")}</span>
            </button>
          </div>
        </div>

        <nav className="hidden lg:block border-t border-outline-variant/40 py-1" aria-label="Primary navigation">
          <ul className="flex items-center justify-center gap-2">
            <DesktopNav unreadAlerts={unreadCount} />
          </ul>
        </nav>
      </div>
    </header>
  );
}

function MenuLink({ icon, label, to, onGo }: { icon: string; label: string; to: string; onGo: () => void }): JSX.Element {
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onGo();
        navigate(to);
      }}
      className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
    >
      <Icon name={icon} className="text-[18px] text-primary" /> {label}
    </a>
  );
}

export function NewsTicker(): JSX.Element {
  const { data } = useAlerts();
  const current = data?.[0];
  if (!current) return <></>;
  return (
    <div className="bg-primary-container text-on-primary py-1.5 px-4 text-body-sm flex items-center gap-3 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
        <a href={ROUTES.ALERTS} className="bg-secondary text-on-secondary px-2 py-0.5 rounded text-label-sm font-bold uppercase tracking-wider flex-shrink-0">
          Latest Alert
        </a>
        <div className="overflow-hidden whitespace-nowrap w-full relative ticker-wrap">
          <div className="ticker-track text-surface-container-high">
            <span className="mr-10">{current.title} — {current.area} • Updated {new Date(current.postedAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
