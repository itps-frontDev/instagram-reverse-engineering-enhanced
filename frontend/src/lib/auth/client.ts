"use client";

import { useEffect, useState } from "react";

import { type Session } from "@/lib/auth/index";

type ApiErrorPayload = {
  error?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignInResult = {
  error?: string;
};

let accessTokenMemory: string | null = null;
let accessTokenExpiresAtMs = 0;
let refreshInFlight: Promise<string | null> | null = null;

function readApiErrorMessage(payload: unknown, fallbackMessage: string): string {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }

  const record = payload as ApiErrorPayload;
  return typeof record.error === "string" && record.error.trim().length > 0
    ? record.error
    : fallbackMessage;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAccessTokenValid(): boolean {
  if (!accessTokenMemory) {
    return false;
  }

  return Date.now() < accessTokenExpiresAtMs - 5_000;
}

export function setAccessToken(accessToken: string, expiresInSeconds: number): void {
  accessTokenMemory = accessToken;
  accessTokenExpiresAtMs = Date.now() + expiresInSeconds * 1000;
}

export function clearAccessToken(): void {
  accessTokenMemory = null;
  accessTokenExpiresAtMs = 0;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      clearAccessToken();
      return null;
    }

    const payload = (await parseJsonSafe(response)) as
      | { accessToken?: string; expiresIn?: number }
      | null;

    if (!payload?.accessToken || typeof payload.expiresIn !== "number") {
      clearAccessToken();
      return null;
    }

    setAccessToken(payload.accessToken, payload.expiresIn);
    return payload.accessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const firstHeaders = new Headers(init.headers);
  if (isAccessTokenValid() && accessTokenMemory) {
    firstHeaders.set("Authorization", `Bearer ${accessTokenMemory}`);
  }

  const firstResponse = await fetch(input, {
    ...init,
    headers: firstHeaders,
    cache: "no-store",
  });

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    return firstResponse;
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  return await fetch(input, {
    ...init,
    headers: retryHeaders,
    cache: "no-store",
  });
}

export const signIn = {
  async email(input: LoginInput): Promise<SignInResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "same-origin",
    body: JSON.stringify({
      identifier: input.email,
      password: input.password,
      redirect: "/",
    }),
  });

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      return {
        error: readApiErrorMessage(payload, "Autenticazione non disponibile."),
      };
    }

    const typedPayload = payload as { accessToken?: string; expiresIn?: number } | null;
    if (!typedPayload?.accessToken || typeof typedPayload.expiresIn !== "number") {
      return { error: "Risposta autenticazione non valida." };
    }

    setAccessToken(typedPayload.accessToken, typedPayload.expiresIn);
    return {};
  },
};

export async function signOut(): Promise<void> {
  const headers = new Headers();
  if (isAccessTokenValid() && accessTokenMemory) {
    headers.set("Authorization", `Bearer ${accessTokenMemory}`);
  }

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers,
      cache: "no-store",
      credentials: "same-origin",
    });
  } finally {
    clearAccessToken();
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadSession = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (!isCancelled) {
            setSession(null);
          }
          return;
        }

        const payload = (await parseJsonSafe(response)) as { session?: Session } | null;

        if (!payload?.session) {
          if (!isCancelled) {
            setSession(null);
          }
          return;
        }

        if (!isCancelled) {
          setSession(payload.session);
        }
      } catch {
        if (!isCancelled) {
          setSession(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    session,
    isLoading,
  };
}

