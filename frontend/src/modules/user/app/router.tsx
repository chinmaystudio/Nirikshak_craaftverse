import { useEffect, useState, useCallback } from "react";

export interface RouteLocation {
  path: string;
  query: Record<string, string>;
}

let listeners = new Set<() => void>();
let notifyVersion = 0;

function onLocationChange(): void {
  notifyVersion += 1;
  listeners.forEach((l) => l());
}

export function parseHash(): RouteLocation {
  const pathname = window.location.pathname.replace(/\\/g, "/");
  let h = pathname === "/" || pathname === "/user" || pathname === "/user/"
    ? "/"
    : pathname.startsWith("/user/")
      ? pathname.slice(5)
      : pathname;

  const qIdx = h.indexOf("?");
  const pathPart = qIdx === -1 ? h : h.slice(0, qIdx);
  const query: Record<string, string> = {};
  
  // Also parse query from window.location.search if not in hash
  const queryString = window.location.search.replace(/^\?/, "");
  if (queryString) {
    queryString.split("&").forEach((pair) => {
      if (!pair) return;
      const [k, v] = pair.split("=");
      query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
    });
  }

  const path = "/" + pathPart.split("/").filter(Boolean).join("/");
  return { path: path === "//" ? "/" : path, query };
}

export function navigate(to: string): void {
  if (!to) return;
  // Clean leading hash if present to normalize
  const clean = to.startsWith("#") ? to.slice(1) : to;
  const [rawPath, query = ""] = (clean.startsWith("/") ? clean : `/${clean}`).split("?");
  const path = rawPath === "/user" ? "/" : rawPath.replace(/^\/user(?=\/)/, "");
  const target = path === "/" ? "/user" : `/user${path}`;
  const url = `${target}${query ? `?${query}` : ""}`;
  if (`${window.location.pathname}${window.location.search}` === url) {
    onLocationChange();
  } else {
    window.history.pushState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

// Global click interceptor for internal links
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    
    // Ignore middle clicks, ctrl/cmd clicks, downloads, external links
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      a.target === "_blank" ||
      a.hasAttribute("download")
    ) {
      return;
    }

    const href = a.getAttribute("href");
    if (!href) return;

    // Ignore external protocols
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    // Legacy hash links are normalized into canonical /user paths.
    if (href.startsWith("#/")) {
      e.preventDefault();
      navigate(href.slice(1));
      return;
    }

    // Handle standard relative paths (/projects, /complaints)
    if (href.startsWith("/") && !href.startsWith("//")) {
      if (href.startsWith("/government") || href.startsWith("/contractor") || href.startsWith("/user")) {
        return;
      }
      e.preventDefault();
      navigate(href);
      return;
    }
  });
}

export function useLocation(): RouteLocation & { fullPath: string } {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = (): void => setTick((t) => t + 1);
    if (listeners.size === 0) {
      window.addEventListener("hashchange", onLocationChange);
      window.addEventListener("popstate", onLocationChange);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const { path, query } = parseHash();
  const fullPath = `${path}${Object.keys(query).length ? "?" : ""}${Object.entries(query)
    .map(([k, v]) => `${k}=${v}`)
    .join("&")}`;
  return { path, query, fullPath };
}

export function useNavigate(): (to: string) => void {
  return useCallback(navigate, []);
}

export interface MatchParams {
  [key: string]: string;
}

export function matchPattern(pattern: string, path: string): MatchParams | null {
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = path.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return null;
  const params: MatchParams = {};
  for (let i = 0; i < patternSegs.length; i++) {
    if (patternSegs[i].startsWith(":")) {
      params[patternSegs[i].slice(1)] = decodeURIComponent(pathSegs[i]);
    } else if (patternSegs[i] !== pathSegs[i]) {
      return null;
    }
  }
  return params;
}

/**
 * Safely extracts dynamic route ID from current path
 */
export function getRouteId(): string {
  const { path } = parseHash();
  const parts = path.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : "";
}
