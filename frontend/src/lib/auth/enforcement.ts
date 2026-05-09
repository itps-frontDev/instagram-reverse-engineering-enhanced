export function isAuthEnforcementEnabled(): boolean {
  return process.env.AUTH_ENFORCEMENT_ENABLED?.toLowerCase() !== "false";
}
