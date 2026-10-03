import { useSyncExternalStore } from "react";
import type { Citizen, Language } from "@/types/user";
import type { Complaint } from "@/types/complaint";
import type { CommunityComment } from "@/types/community";
import type { VisionAnalysis } from "@/types/infrastructure";
import type { ChatMessage, LocationPrefill, ReportPrefill } from "@/types/api";

export interface AppSettings {
  alerts: boolean;
  sla: boolean;
  community: boolean;
}

export interface AppStoreState {
  user: Citizen | null;
  lang: Language;
  fontScale: number;
  readAlerts: string[];
  confirmed: string[];
  upvoted: string[];
  comments: Record<string, CommunityComment[]>;
  created: Complaint[];
  chat: ChatMessage[];
  settings: AppSettings;
  lastSubmitted: string | null;
  locationPrefill: LocationPrefill | null;
  visionPrefill: ReportPrefill | null;
  next: string | null;
  vision: VisionAnalysis[];
  visionCount: number;
}

const STORAGE_KEY = "nirikshan.ts.v1";

const DEFAULT_STATE: AppStoreState = {
  user: null,
  lang: "en",
  fontScale: 100,
  readAlerts: [],
  confirmed: [],
  upvoted: [],
  comments: {},
  created: [],
  chat: [],
  settings: { alerts: true, sla: true, community: true },
  lastSubmitted: null,
  locationPrefill: null,
  visionPrefill: null,
  next: null,
  vision: [],
  visionCount: 0
};

function load(): AppStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AppStoreState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      user: null, // Rule 31: Supabase Auth is source of truth; never trust persisted user in localStorage
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings ?? {}) },
      readAlerts: parsed.readAlerts ?? [],
      confirmed: parsed.confirmed ?? [],
      upvoted: parsed.upvoted ?? [],
      comments: parsed.comments ?? {},
      created: parsed.created ?? [],
      chat: parsed.chat ?? [],
      vision: parsed.vision ?? []
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

let state: AppStoreState = load();
const listeners = new Set<() => void>();

function persist(): void {
  try {
    // Strip user object before writing to localStorage (Rule 31)
    const { user: _omittedUser, ...persistedState } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  } catch {
    /* storage unavailable — session-only mode */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

export const appStore = {
  getState(): AppStoreState {
    return state;
  },
  setState(patch: Partial<AppStoreState>): void {
    state = { ...state, ...patch };
    persist();
    emit();
  },
  resetSession(): void {
    state = {
      ...state,
      user: null,
      created: [],
      chat: [],
      lastSubmitted: null,
      locationPrefill: null,
      visionPrefill: null,
      next: null
    };
    persist();
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export function useAppState<T>(selector: (s: AppStoreState) => T): T {
  return useSyncExternalStore(appStore.subscribe, () => selector(appStore.getState()));
}
