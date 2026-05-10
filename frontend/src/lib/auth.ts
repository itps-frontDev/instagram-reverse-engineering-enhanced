import { cookies } from "next/headers";

import { profileRepository } from "@/repositories";
import { AuthBackendError, getAccessTokenCookieName, meWithSpring } from "@/lib/auth/backend";
import { type Profile } from "@/types/profile";

type CurrentUser = {
  id: number;
  email: string | null;
  phone_number: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value?.trim();
    if (!accessToken) return null;

    const me = await meWithSpring(accessToken);
    const userId = Number(me.id);
    if (!Number.isFinite(userId)) return null;

    return {
      id: userId,
      email: me.email ?? null,
      phone_number: me.phoneNumber ?? null,
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

export async function getCurrentUserId(): Promise<number | null> {
  return (await getCurrentUser())?.id ?? null;
}

export async function getCurrentProfileId(): Promise<number | null> {
  return (await getCurrentProfile())?.id ?? null;
}
