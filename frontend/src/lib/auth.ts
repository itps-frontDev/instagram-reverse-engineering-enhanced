import { cookies } from "next/headers";

import { profileRepository } from "@/repositories";
import { AuthBackendError, getAccessTokenCookieName, meWithSpring } from "@/lib/auth/backend";
import { type Profile } from "@/types/profile";

type CurrentUser = {
  id: string;
  email: string | null;
  phone_number: string | null;
  username: string | null;
  full_name: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value?.trim();
    if (!accessToken) return null;

    const me = await meWithSpring(accessToken);
    const userId = me.id.trim();
    if (!userId) return null;

    return {
      id: userId,
      email: me.email ?? null,
      phone_number: me.phoneNumber ?? null,
      username: me.username ?? null,
      full_name: me.fullName ?? null,
    };
  } catch (error) {
    if (error instanceof AuthBackendError) return null;
    console.error("[Auth] Errore nel recupero dell'utente corrente:", error);
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    return await profileRepository.findByUserId(user.id) || null;
  } catch (error) {
    console.error("[Auth] Errore nel recupero del profilo corrente:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}

export async function getCurrentProfileId(): Promise<number | null> {
  return (await getCurrentProfile())?.id ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(getAccessTokenCookieName())?.value?.trim() ?? null;
  } catch {
    return null;
  }
}
