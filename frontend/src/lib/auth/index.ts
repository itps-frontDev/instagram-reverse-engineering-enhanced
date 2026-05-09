import { z } from "zod";

import { isAppRole } from "@/lib/auth/rbac";

export const SESSION_COOKIE_NAME = "fatellisync_session";

const sessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
    role: z.string().min(1),
  }),
  expiresAt: z.iso.datetime(),
});

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "backoffice";
  };
  expiresAt: string;
};

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const pairs = cookieHeader.split(";");
  const entries: Record<string, string> = {};

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    entries[key] = decodeURIComponent(rawValue);
  }

  return entries;
}

export function serializeSession(session: Session): string {
  return JSON.stringify(session);
}

export function deserializeSession(serialized: string): Session | null {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    const validated = sessionSchema.safeParse(parsed);
    if (!validated.success) {
      return null;
    }

    if (!isAppRole(validated.data.user.role)) {
      return null;
    }

    const expiresAtMs = Date.parse(validated.data.expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return null;
    }

    return {
      user: {
        id: validated.data.user.id,
        email: validated.data.user.email,
        name: validated.data.user.name,
        role: validated.data.user.role,
      },
      expiresAt: validated.data.expiresAt,
    };
  } catch {
    return null;
  }
}

export function readSessionFromHeaders(headers: Headers): Session | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);
  const serializedSession = cookies[SESSION_COOKIE_NAME];
  if (!serializedSession) {
    return null;
  }

  return deserializeSession(serializedSession);
}

export const auth = {
  api: {
    getSession(headers: Headers): Session | null {
      return readSessionFromHeaders(headers);
    },
  },
};
