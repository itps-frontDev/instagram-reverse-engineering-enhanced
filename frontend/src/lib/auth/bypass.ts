import { type Session } from "@/lib/auth";

export function isAuthBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS?.toLowerCase() === "true";
}

export function buildAuthBypassSession(): Session {
  return {
    user: {
      id: "bypass-user",
      email: "bypass@localhost",
      name: "Bypass User",
      role: "admin",
    },
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}
