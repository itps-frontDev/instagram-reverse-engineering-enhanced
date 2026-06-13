/**
 * Determina il flag `Secure` dei cookie di autenticazione.
 *
 * Un cookie `Secure` viene scartato dal browser su connessioni non-HTTPS
 * (eccetto `localhost`). Per una demo servita in HTTP puro su un dominio reale
 * va quindi disattivato, altrimenti il login riesce ma il cookie non viene
 * salvato e l'utente resta bloccato sulla pagina di login.
 *
 * Comportamento:
 * - `COOKIE_SECURE=false` → mai Secure (demo HTTP su dominio reale)
 * - `COOKIE_SECURE=true`  → sempre Secure (deploy HTTPS)
 * - non impostata         → Secure solo in produzione (default storico)
 *
 * Nessun import esterno: il modulo è importabile anche dal middleware (edge).
 */
export function isCookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === "false") return false;
  if (override === "true") return true;
  return process.env.NODE_ENV === "production";
}
