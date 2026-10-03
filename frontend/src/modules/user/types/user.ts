export type Language = "en" | "hi" | "mr";

export interface Citizen {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  ward: string;
  city: string;
  preferredLanguage: Language;
  verified: boolean;
  joinedAt: string;
}

export interface UserSession {
  user: Citizen | null;
}
