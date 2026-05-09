import { cookies } from "next/headers";

import { auth } from "@/lib/auth/index";
import { profileRepository } from "@/repositories";
import { type Profile } from "@/types/profile";

export const AUTH_COOKIE_NAME = "iree_session";

type CurrentUser = {
  id: number;
  email: string | null;
  phone_number: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const headerParts = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`);

    const headers = new Headers();
    if (headerParts.length > 0) {
      headers.set("cookie", headerParts.join("; "));
    }

    const session = auth.api.getSession(headers);
    if (!session?.user.id) {
      return null;
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      return null;
    }

    return {
      id: userId,
      email: session.user.email ?? null,
      phone_number: session.user.phoneNumber ?? null,
    };
  } catch (error) {
    console.error("[Auth] Errore nel recupero dell'utente corrente:", error);
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const profile = await profileRepository.findByUserId(user.id);
    return profile || null;
  } catch (error) {
    console.error("[Auth] Errore nel recupero del profilo corrente:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getCurrentProfileId(): Promise<number | null> {
  const profile = await getCurrentProfile();
  return profile?.id ?? null;
}
