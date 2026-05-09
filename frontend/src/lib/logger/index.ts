import pino from "pino";

/**
 * Logger singleton applicativo.
 *
 * Usiamo logging strutturato JSON per avere eventi interrogabili
 * e uniformi tra sviluppo e produzione. In sviluppo abilitiamo
 * pino-pretty solo se richiesto esplicitamente via env, cosi'
 * evitiamo crash in runtime Proxy/Turbopack.
 */
function isEnvTrue(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

const shouldUsePrettyTransport =
  process.env.NODE_ENV !== "production" &&
  isEnvTrue(process.env.LOG_PRETTY) &&
  process.env.NEXT_RUNTIME !== "edge";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    // Difesa base contro data leakage accidentale nei log.
    paths: ["password", "token", "authorization", "headers.authorization"],
    censor: "[REDACTED]",
  },
  transport: shouldUsePrettyTransport
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
