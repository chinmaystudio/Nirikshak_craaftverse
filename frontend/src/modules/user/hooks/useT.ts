import { useCallback } from "react";
import { useAppState, appStore } from "@/app/providers/store";
import { translate, type I18nKey } from "@/constants/i18n";
import type { Language } from "@/types/user";

export function useT(): { t: (key: I18nKey) => string; lang: Language; setLang: (lang: Language) => void } {
  const lang = useAppState((s) => s.lang);
  const t = useCallback((key: I18nKey) => translate(lang, key), [lang]);
  const setLang = useCallback((next: Language) => {
    appStore.setState({ lang: next });
  }, []);
  return { t, lang, setLang };
}

export { LANGUAGES, LANGUAGE_ORDER } from "@/constants/i18n";
