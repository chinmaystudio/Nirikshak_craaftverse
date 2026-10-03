import { useEffect } from "react";
import { appStore, useAppState } from "@/app/providers/store";
import type { Citizen, Language } from "@/types/user";
import type { AppSettings } from "@/app/providers/store";
import { logout as svcLogout, syncCitizenSession } from "@/services/auth/authService";

export interface UseAuthResult {
  user: Citizen | null;
  isLoggedIn: boolean;
  lang: Language;
  fontScale: number;
  settings: AppSettings;
  setLang: (lang: Language) => void;
  setFontScale: (scale: number) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  useEffect(() => {
    syncCitizenSession().catch(() => {});
  }, []);

  const user = useAppState((s) => s.user);
  const lang = useAppState((s) => s.lang);
  const fontScale = useAppState((s) => s.fontScale);
  const settings = useAppState((s) => s.settings);

  const setLang = (next: Language): void => {
    appStore.setState({ lang: next });
  };
  const setFontScale = (scale: number): void => {
    appStore.setState({ fontScale: scale });
  };
  const updateSettings = (patch: Partial<AppSettings>): void => {
    appStore.setState({ settings: { ...settings, ...patch } });
  };
  const logout = (): Promise<void> => svcLogout();

  return { user, isLoggedIn: user !== null, lang, fontScale, settings, setLang, setFontScale, updateSettings, logout };
}
