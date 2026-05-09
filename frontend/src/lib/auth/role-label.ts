import { type AppRole } from "@/lib/auth/rbac";

export function getUserRoleLabel(role: AppRole): string {
  if (role === "admin") {
    return "Amministratore";
  }

  return "Backoffice";
}
