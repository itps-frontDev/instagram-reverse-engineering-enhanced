"use server";

import { cookies } from "next/headers";

import {
  buildSpringAuthUrl,
  getAccessTokenCookieName,
  getRefreshTokenCookieName,
  refreshWithSpring,
} from "@/lib/auth/backend";
import { SpringAuthError } from "@/lib/spring-error";
import { isCookieSecure } from "@/lib/auth/cookie-security";

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getAccessTokenCookieName())?.value ?? null;
}

async function tryRefresh(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;
    if (!refreshToken) return null;

    const secure = isCookieSecure();
    const tokenPayload = await refreshWithSpring(refreshToken);

    cookieStore.set({
      name: getAccessTokenCookieName(),
      value: tokenPayload.accessToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: tokenPayload.expiresIn,
      secure,
    });
    cookieStore.set({
      name: getRefreshTokenCookieName(),
      value: tokenPayload.refreshToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: tokenPayload.refreshExpiresIn,
      secure,
    });

    return tokenPayload.accessToken;
  } catch {
    return null;
  }
}

export async function springFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const buildRequest = (token: string): RequestInit => ({
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
    signal: options.signal ?? AbortSignal.timeout(10_000),
  });

  let accessToken = await getAccessToken();

  // Access token cookie expired/missing — try silent refresh before giving up
  if (!accessToken) {
    accessToken = await tryRefresh();
    if (!accessToken) {
      throw new SpringAuthError(401, "Session expired, please log in again.");
    }
    return fetch(buildSpringAuthUrl(path), buildRequest(accessToken));
  }

  let response = await fetch(buildSpringAuthUrl(path), buildRequest(accessToken));

  // Token present but rejected by backend (edge case: clock skew, blacklist, etc.)
  if (response.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) {
      throw new SpringAuthError(401, "Session expired, please log in again.");
    }
    response = await fetch(buildSpringAuthUrl(path), buildRequest(newToken));
  }

  return response;
}
