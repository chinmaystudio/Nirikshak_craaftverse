import { useEffect, useState } from "react";
import { Header, NewsTicker } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AssistantFab } from "@/components/ai/AssistantWidget";
import { ToastViewport } from "@/components/common/ToastViewport";
import { PolicyDialog, type PolicyKey } from "@/components/layout/PolicyDialog";
import { useLocation, navigate, matchPattern } from "./router";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

import { LandingPage } from "@/landing/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { HomePage } from "@/pages/home/HomePage";
import { NearbyProjectsPage } from "@/pages/projects/NearbyProjectsPage";
import { ProjectDetailsPage } from "@/pages/projects/ProjectDetailsPage";
import { ReportIssuePage } from "@/pages/report/ReportIssuePage";
import { ReportSuccessPage } from "@/pages/report/ReportSuccessPage";
import { MyComplaintsPage } from "@/pages/complaints/MyComplaintsPage";
import { ComplaintDetailsPage } from "@/pages/complaints/ComplaintDetailsPage";
import { CommunityPage } from "@/pages/community/CommunityPage";
import { CommunityIssueDetailsPage } from "@/pages/community/CommunityIssueDetailsPage";
import { AlertsPage } from "@/pages/alerts/AlertsPage";
import { AlertDetailsPage } from "@/pages/alerts/AlertDetailsPage";
import { IdentifyInfrastructurePage } from "@/pages/vision/IdentifyInfrastructurePage";
import { VisionResultPage } from "@/pages/vision/VisionResultPage";
import { VisionHistoryPage } from "@/pages/vision/VisionHistoryPage";
import { AssistantPage } from "@/pages/assistant/AssistantPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { SettingsPage } from "@/pages/profile/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

interface RouteDef {
  pattern: string;
  render: () => JSX.Element;
  auth?: boolean;
  guestOnly?: boolean;
  chrome?: "full" | "auth" | "landing";
}

const ROUTE_TABLE: RouteDef[] = [
  { pattern: "/", chrome: "landing", render: () => <LandingPage /> },
  { pattern: "/user", chrome: "landing", render: () => <LandingPage /> },
  { pattern: "/login", guestOnly: true, chrome: "auth", render: () => <LoginPage /> },
  { pattern: "/register", guestOnly: true, chrome: "auth", render: () => <RegisterPage /> },
  { pattern: "/app", auth: true, render: () => <HomePage /> },
  { pattern: "/home", auth: true, render: () => <HomePage /> },
  { pattern: "/projects", render: () => <NearbyProjectsPage /> },
  { pattern: "/projects/:id", render: () => <ProjectDetailsPage /> },
  { pattern: "/report", auth: true, render: () => <ReportIssuePage /> },
  { pattern: "/report/success", auth: true, render: () => <ReportSuccessPage /> },
  { pattern: "/complaints", auth: true, render: () => <MyComplaintsPage /> },
  { pattern: "/complaints/:id", auth: true, render: () => <ComplaintDetailsPage /> },
  { pattern: "/community", render: () => <CommunityPage /> },
  { pattern: "/community/:id", render: () => <CommunityIssueDetailsPage /> },
  { pattern: "/alerts", render: () => <AlertsPage /> },
  { pattern: "/alerts/:id", render: () => <AlertDetailsPage /> },
  { pattern: "/vision", render: () => <IdentifyInfrastructurePage /> },
  { pattern: "/vision/result", render: () => <VisionResultPage /> },
  { pattern: "/vision/result/:id", render: () => <VisionResultPage /> },
  { pattern: "/vision/history", render: () => <VisionHistoryPage /> },
  { pattern: "/assistant", render: () => <AssistantPage /> },
  { pattern: "/profile", auth: true, render: () => <ProfilePage /> },
  { pattern: "/settings", auth: true, render: () => <SettingsPage /> },
  { pattern: "/notfound", render: () => <NotFoundPage /> }
];

export function App(): JSX.Element {
  const { path, query, fullPath } = useLocation();
  const auth = useAuth();
  useT();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [policyKey, setPolicyKey] = useState<PolicyKey | null>(null);

  useEffect(() => {
    document.documentElement.lang = auth.lang;
    document.body.style.fontSize = `${auth.fontScale}%`;
  }, [auth.fontScale, auth.lang]);

  useEffect(() => {
    const goOffline = (): void => {
      setOffline(true);
      toast("You are offline. Some live data cannot be fetched.", "error");
    };
    const goOnline = (): void => {
      setOffline(false);
      toast("Back online.", "success");
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event): void => {
      setPolicyKey((e as CustomEvent<string>).detail as PolicyKey);
    };
    document.addEventListener("nirikshan:policy", handler);
    return () => document.removeEventListener("nirikshan:policy", handler);
  }, []);

  const route = ROUTE_TABLE.find((r) => matchPattern(r.pattern, path) !== null) ?? {
    pattern: "/notfound",
    render: (): JSX.Element => <NotFoundPage />,
    auth: false,
    guestOnly: false,
    chrome: "full" as const
  };
  const params = matchPattern(route.pattern, path) ?? {};

  useEffect(() => {
    if (route.auth && !auth.isLoggedIn) {
      const qs = Object.entries(query)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      const next = `/user${path}${qs ? `?${qs}` : ""}`;
      void import("@/app/providers/store").then(({ appStore }) => appStore.setState({ next }));
      toast("Please sign in with your registered account to continue.", "info");
      navigate(ROUTES.LOGIN);
    }
    if (route.guestOnly && auth.isLoggedIn) {
      navigate(ROUTES.HOME);
    }
  }, [route, auth.isLoggedIn, path, query]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [fullPath]);

  const isAuthChrome = route.chrome === "auth";
  const redirecting = (route.auth === true && !auth.isLoggedIn) || (route.guestOnly === true && auth.isLoggedIn);
  const routeKey = `${route.pattern}:${JSON.stringify(params)}`;

  if (route.chrome === "landing" || path === "/" || path === "" || path === "/user") {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0d1c2e]">
      <button
        id="skip-link"
        type="button"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-1 focus:left-1 focus:bg-secondary focus:text-on-secondary focus:px-3 focus:py-1.5 focus:rounded focus:text-label-md font-bold"
        onClick={() => {
          const view = document.getElementById("view");
          view?.setAttribute("tabindex", "-1");
          view?.focus();
        }}
      >
        Skip to Main Content
      </button>

      {offline ? (
        <div className="bg-error text-on-error text-center text-label-md font-bold py-1.5 px-4">
          You are offline — showing the last cached experience. Live data will refresh automatically once reconnected.
        </div>
      ) : null}

      <Header />
      {!isAuthChrome ? <NewsTicker /> : null}

      <main id="view" className="flex-grow max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 view-enter" tabIndex={-1}>
        <div key={routeKey} className="view-enter">
          {redirecting ? (
            <div className="p-10 text-center text-body-sm text-on-surface-variant">Redirecting…</div>
          ) : (
            route.render()
          )}
        </div>
      </main>

      <Footer />
      <MobileNavigation />
      {!isAuthChrome && path !== "/assistant" && !path.startsWith("/vision") ? <AssistantFab /> : null}
      <PolicyDialog policyKey={policyKey} onClose={() => setPolicyKey(null)} />
      <ToastViewport />
    </div>
  );
}
