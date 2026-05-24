"use server";

import { cookies } from "next/headers";

import { getMeProfileAction, type MeProfile } from "@/features/profile";
import {
  AuthBackendError,
  getAccessTokenCookieName,
  getAccessTokenCookiePath,
  getRefreshTokenCookieName,
  getRefreshTokenCookiePath,
  loginWithSpring,
  refreshWithSpring,
  registerWithSpring,
} from "@/lib/auth/backend";
import { sanitizeInternalRedirectPath } from "@/lib/auth/redirect";
import type { AuthActionResult, LoginData, LoginInput, RegisterData, RegisterInput } from "@/features/auth/schema";
import { loginInputSchema, registerInputSchema } from "@/features/auth/schema";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
const LOGIN_RETRY_DELAYS_MS = [350, 900, 1500] as const;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildTokenCookies(
  cookieStore: CookieStore,
  payload: { accessToken: string; expiresIn: number; refreshToken: string; refreshExpiresIn: number }
) {
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set({
    name: getAccessTokenCookieName(),
    value: payload.accessToken,
    httpOnly: true,
    sameSite: "lax",
    path: getAccessTokenCookiePath(),
    maxAge: payload.expiresIn,
    secure,
  });
  cookieStore.set({
    name: getRefreshTokenCookieName(),
    value: payload.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    path: getRefreshTokenCookiePath(),
    maxAge: payload.refreshExpiresIn,
    secure,
  });
}

export async function loginAction(input: LoginInput): Promise<AuthActionResult<LoginData>> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input payload." };
  }

  const redirectTo = sanitizeInternalRedirectPath(parsed.data.redirect, "/");

  try {
    let tokenPayload: Awaited<ReturnType<typeof loginWithSpring>> | null = null;
    const retryDelays = [0, ...LOGIN_RETRY_DELAYS_MS];

    // Retry progressivo su errori transitori (warm-up backend post restart).
    for (const retryDelayMs of retryDelays) {
      try {
        if (retryDelayMs > 0) {
          await delay(retryDelayMs);
        }
        tokenPayload = await loginWithSpring(parsed.data);
        break;
      } catch (error) {
        if (!(error instanceof AuthBackendError) || error.status < 500) {
          throw error;
        }
      }
    }

    if (!tokenPayload) {
      return { success: false, error: "Authentication temporarily unavailable." };
    }

    const cookieStore = await cookies();
    buildTokenCookies(cookieStore, tokenPayload);
    return { success: true, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthBackendError) {
      if (error.status === 401) return { success: false, error: "Invalid credentials." };
      if (error.status === 429) return { success: false, error: "Account temporarily locked." };
    }
    return { success: false, error: "Authentication temporarily unavailable." };
  }
}

export async function registerAction(input: RegisterInput): Promise<AuthActionResult<RegisterData>> {
  const parsed = registerInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input payload." };
  }

  try {
    const response = await registerWithSpring(parsed.data);
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof AuthBackendError) {
      if (error.status === 409) {
        if (error.backendErrorCode === "EMAIL_ALREADY_EXISTS") {
          return { success: false, error: "Email already registered." };
        }
        if (error.backendErrorCode === "USERNAME_ALREADY_EXISTS") {
          return { success: false, error: "Username already exists." };
        }
      }

      if (error.status === 400) {
        return { success: false, error: "Invalid registration data." };
      }
    }

    return { success: false, error: "Registration temporarily unavailable." };
  }
}

export async function refreshAction(): Promise<AuthActionResult<{ refreshed: boolean }>> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;
    if (!refreshToken) {
      return { success: false, error: "Missing refresh token." };
    }

    const tokenPayload = await refreshWithSpring(refreshToken);
    buildTokenCookies(cookieStore, tokenPayload);
    return { success: true, data: { refreshed: true } };
  } catch {
    return { success: false, error: "Refresh failed." };
  }
}

export async function getMyProfileAction(): Promise<AuthActionResult<MeProfile | null>> {
  try {
    const result = await getMeProfileAction();
    if (!result.success) return { success: true, data: null };
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Profile fetch failed." };
  }
}

export async function logoutAction(): Promise<AuthActionResult<null>> {
  const cookieStore = await cookies();

  try {
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;
    const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;

    if (accessToken && refreshToken) {
      const springBaseUrl = process.env.SPRING_API_BASE_URL ?? "http://localhost:8080";
      await fetch(`${springBaseUrl}/api/priv/auth/logout`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(10_000),
      });
    }
  } catch {
    // Spring call failed (timeout, network error, etc.) — ignore, always clear cookies
  } finally {
    cookieStore.set({ name: getAccessTokenCookieName(), value: "", path: getAccessTokenCookiePath(), maxAge: 0 });
    cookieStore.set({ name: getRefreshTokenCookieName(), value: "", path: getRefreshTokenCookiePath(), maxAge: 0 });
  }

  return { success: true, data: null };
}
