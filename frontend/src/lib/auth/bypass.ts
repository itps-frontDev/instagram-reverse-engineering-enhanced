import { type Session } from "@/lib/auth/index";

export function isAuthBypassEnabled(): boolean {
  return process.env.AUTH_BYPASS?.toLowerCase() === "true";
}

export function buildAuthBypassSession(): Session {
  return {
    user: {
      id: "bypass-user",
      email: "bypass@localhost",
      phoneNumber: null,
    },
  };
}
