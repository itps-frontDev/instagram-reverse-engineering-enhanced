export type AppRole = "admin" | "backoffice";

export const publicRoutes = new Set<string>(["/login", "/unauthorized"]);

export function isAppRole(value: string): value is AppRole {
  return value === "admin" || value === "backoffice";
}
