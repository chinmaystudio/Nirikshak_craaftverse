import type { Language } from "@/types/user";

export const LANGUAGES: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी"
};

export const LANGUAGE_ORDER: Language[] = ["en", "hi", "mr"];

export type I18nKey =
  | "nav.home"
  | "nav.projects"
  | "nav.report"
  | "nav.complaints"
  | "nav.community"
  | "nav.alerts"
  | "cta.lodge"
  | "cta.login"
  | "tagline"
  | "assistant";

type Dictionary = Record<I18nKey, string>;

const EN: Dictionary = {
  "nav.home": "Home",
  "nav.projects": "Nearby Projects",
  "nav.report": "Report an Issue",
  "nav.complaints": "My Complaints",
  "nav.community": "Community",
  "nav.alerts": "Alerts",
  "cta.lodge": "Report an Issue",
  "cta.login": "Login / Register",
  tagline: "Track. Understand. Report. Participate.",
  assistant: "AI Assistant"
};

const HI: Dictionary = {
  "nav.home": "होम",
  "nav.projects": "निकटवर्ती परियोजनाएँ",
  "nav.report": "शिकायत दर्ज करें",
  "nav.complaints": "मेरी शिकायतें",
  "nav.community": "समुदाय",
  "nav.alerts": "अलर्ट",
  "cta.lodge": "शिकायत दर्ज करें",
  "cta.login": "लॉगिन / पंजीकरण",
  tagline: "ट्रैक करें। समझें। रिपोर्ट करें। भागीदारी करें।",
  assistant: "एआई सहायक"
};

const MR: Dictionary = {
  "nav.home": "मुख्यपृष्ठ",
  "nav.projects": "जवळपासचे प्रकल्प",
  "nav.report": "तक्रार नोंदवा",
  "nav.complaints": "माझ्या तक्रारी",
  "nav.community": "समुदाय",
  "nav.alerts": "सूचना",
  "cta.lodge": "तक्रार नोंदवा",
  "cta.login": "लॉगिन / नोंदणी",
  tagline: "मागोवा घ्या. समजून घ्या. नोंदवा. सहभागी व्हा.",
  assistant: "एआय सहाय्यक"
};

const DICTIONARIES: Record<Language, Dictionary> = { en: EN, hi: HI, mr: MR };

export function translate(lang: Language, key: I18nKey): string {
  return DICTIONARIES[lang][key] ?? EN[key] ?? key;
}
