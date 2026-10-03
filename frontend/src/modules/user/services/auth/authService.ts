import type { Citizen } from "@/types/user";
import { appStore } from "@/app/providers/store";
import { AuthService } from "@/core/auth/auth.service";
import { supabase } from "@/core/supabase/client";

export interface AuthResult {
  user: Citizen;
  next: string | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  preferredLanguage: Citizen["preferredLanguage"];
  city: string;
  ward: string;
}

export function currentUser(): Citizen | null {
  return appStore.getState().user;
}

export function isLoggedIn(): boolean {
  return appStore.getState().user !== null;
}

// Automatically sync citizen state when Supabase session changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      if (appStore.getState().user !== null) {
        appStore.setState({ user: null });
      }
    }
  });
}

/**
 * Synchronizes appStore citizen state with the authoritative Supabase Auth session.
 */
export async function syncCitizenSession(): Promise<Citizen | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    if (appStore.getState().user !== null) {
      appStore.setState({ user: null });
    }
    return null;
  }
  const user = data.session.user;
  const current = appStore.getState().user;
  if (current && current.id === user.id) {
    return current;
  }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const citizen: Citizen = {
    id: user.id,
    name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Citizen',
    email: user.email,
    mobile: profile?.phone || user.user_metadata?.phone || '',
    city: profile?.city || user.user_metadata?.city || 'Pune',
    ward: user.user_metadata?.ward || 'Ward 12 — Kothrud West',
    preferredLanguage: user.user_metadata?.preferredLanguage || 'en',
    verified: Boolean(user.email_confirmed_at),
    joinedAt: user.created_at ? user.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
  appStore.setState({ user: citizen });
  return citizen;
}

export async function loginWithEmail(email: string, password: string, next: string | null = null): Promise<AuthResult> {
  const session = await AuthService.signIn(email, password);
  const citizen: Citizen = {
    id: session.user.id,
    name: session.profile?.full_name || session.user.email?.split('@')[0] || 'Citizen',
    email: session.user.email,
    mobile: session.profile?.phone || '9876543210',
    city: session.profile?.city || 'Pune',
    ward: 'Ward 12 — Kothrud West',
    preferredLanguage: 'en',
    verified: Boolean(session.user.email_confirmed_at),
    joinedAt: session.user.created_at ? session.user.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };

  appStore.setState({ user: citizen, next: null });
  const target = next ?? appStore.getState().next ?? "/user/home";
  return { user: citizen, next: target };
}

export async function loginWithGoogle(redirectTo: string = "/user/home"): Promise<void> {
  await AuthService.signInWithGoogle(redirectTo);
}

export async function register(payload: RegisterPayload): Promise<Citizen> {
  const password = payload.password || 'NirikshakCitizen#2026';
  const { user } = await AuthService.signUp({
    email: payload.email,
    password,
    fullName: payload.name,
    phone: payload.mobile,
    metadata: {
      ward: payload.ward,
      city: payload.city,
      preferredLanguage: payload.preferredLanguage,
    },
  });

  const citizen: Citizen = {
    id: user?.id || `citizen-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    mobile: payload.mobile || '',
    city: payload.city || 'Pune',
    ward: payload.ward,
    preferredLanguage: payload.preferredLanguage,
    verified: Boolean(user?.email_confirmed_at),
    joinedAt: new Date().toISOString().slice(0, 10),
  };

  appStore.setState({ user: citizen, lang: citizen.preferredLanguage });
  return citizen;
}

export async function logout(): Promise<void> {
  await AuthService.signOut();
  appStore.resetSession();
}

export async function updateProfile(patch: Partial<Citizen>): Promise<Citizen> {
  const current = appStore.getState().user;
  if (!current) throw new Error("Not signed in.");
  
  if (current.id) {
    await supabase.from('profiles').update({
      full_name: patch.name ?? current.name,
      phone: patch.mobile ?? current.mobile,
      city: patch.city ?? current.city,
      updated_at: new Date().toISOString(),
    }).eq('id', current.id);
  }

  const updated = { ...current, ...patch };
  appStore.setState({ user: updated });
  return updated;
}
