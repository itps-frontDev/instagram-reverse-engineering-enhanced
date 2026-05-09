import { type Session } from "@/lib/auth";
import { isAppRole, type AppRole } from "@/lib/auth/rbac";

export function getSessionUserId(session: Session | null): string | null {
  return session?.user.id ?? null;
}

export async function resolveRoleFromSession(session: Session | null): Promise<AppRole | null> {
  const role = session?.user.role;
  if (!role || !isAppRole(role)) {
    return null;
  }

  return role;
}
