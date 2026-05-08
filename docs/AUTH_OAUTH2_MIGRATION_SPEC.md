# OAuth2 Migration Spec (FE JWT -> BE Spring Boot)

## 1) Obiettivo

Migrare l'autenticazione dall'attuale gestione JWT nel frontend Next.js a una gestione centralizzata nel backend Spring Boot con OAuth2, mantenendo il login con:

- email
- numero di telefono
- username

Obiettivo operativo: il frontend non firma/valida più token applicativi; delega login, refresh, logout e validazione sessione al backend.
La migrazione è **secca**: nessuna retrocompatibilità con JWT legacy frontend.

---

## 2) Stato attuale (baseline)

### Frontend

- Login gestito in `frontend/src/app/api/auth/login/route.ts`
- JWT generato in FE (`frontend/src/lib/jwt.ts`)
- Cookie auth (`authToken`) scritto dal FE route handler
- Protezione route via `frontend/src/proxy.ts` con `jwtVerify` lato FE
- Helper auth FE in `frontend/src/lib/auth.ts`

### Backend

- Security minimale in `backend/src/main/java/it/evodev/instagram/config/SecurityConfig.java` (`permitAll`)
- Redis configurato e disponibile per caching/session support
- Nessuna pipeline OAuth2 completa attiva (authorization + token + refresh + revoke)

---

## 3) Architettura target

## 3.1 Pattern scelto: **BFF + OAuth2 Authorization Code + PKCE**

- **BE** espone Authorization Server OAuth2 (Spring Authorization Server) e Resource Server (API protette)
- **FE** è client pubblico OAuth2 (niente client secret in browser)
- Token sensibili non vengono messi in localStorage
- Sessione FE basata su cookie HttpOnly/Secure gestiti dal backend/BFF

## 3.2 Componenti principali

1. **Authorization Server (BE)**  
   Endpoints OAuth2 standard:
   - `/oauth2/authorize`
   - `/oauth2/token`
   - `/oauth2/jwks`
   - `/oauth2/revoke`
   - `/oauth2/introspect` (opzionale, interno)

2. **Identity layer custom (BE)**  
   `UserDetailsService` custom che risolve identifier unificato:
   - se contiene `@` -> email
   - se normalizzato phone -> telefono
   - altrimenti -> username

3. **Frontend auth adapter**  
   Rimuove chiamate legacy (`/api/auth/login`) e usa solo redirect OAuth2 + callback.

4. **Redis integration (BE)**  
   Uso Redis per short-lived auth artifacts:
   - authorization request context/state
   - anti-replay nonce
    - token blacklist/revocation cache (se usata)

## 3.3 Struttura backend (pattern richiesto)

Package layout target:

- `it.evodev.instagram.auth.models` -> entity/model auth (utente, token metadata, ecc.)
- `it.evodev.instagram.auth.dto` -> request/response DTO
- `it.evodev.instagram.auth.controllers` -> REST controller auth/bff endpoints
- `it.evodev.instagram.auth.services` -> business logic auth
- `it.evodev.instagram.auth.repositories` -> accesso dati
- `it.evodev.instagram.auth.security` -> config security, filters, converters
- `it.evodev.instagram.auth.mappers` -> mapping model <-> dto

Regola: i controller non toccano repository direttamente; passano sempre dai service.

---

## 4) Scope e non-scope

### In scope

- Login OAuth2 con email/telefono/username
- Refresh token flow
- Logout con revoca token + invalidazione cookie
- Protezione API backend con bearer token/JWT
- Adeguamento FE per deep link e redirect post-login
- Test unit/integration/e2e auth

### Out of scope (fase 1)

- Social login provider esterni (Google/Facebook)
- MFA/2FA
- Device management avanzato
- Federazione SSO enterprise

---

## 5) Piano implementativo (stream-coding style)

## Fase A - Preparazione backend security

1. Introdurre dipendenze:
   - `spring-boot-starter-oauth2-authorization-server`
   - `spring-boot-starter-oauth2-resource-server`
   - `spring-security-oauth2-jose`
2. Split `SecurityFilterChain`:
   - chain AS endpoints
   - chain API applicative
3. Configurare issuer, key material (JWK), token settings.

**Deliverable:** BE espone endpoint OAuth2 standard e firma JWT server-side.

## Fase B - Identity adapter (email/phone/username)

1. Implementare normalizzazione identifier:
   - email -> lowercase/trim
   - username -> lowercase/trim
   - phone -> formato E.164 normalizzato
2. `UserDetailsService` custom con ricerca ordinata:
   - `findByEmailNormalized`
   - `findByPhoneNormalized`
   - `findByUsernameNormalized`
3. Password check con `BCryptPasswordEncoder`.

**Deliverable:** login form OAuth2 accetta 3 identifier con stessa UX.

## Fase C - Token, refresh, revoke

1. Access token breve (es. 10-15 min)
2. Refresh token rotante (single-use)
3. Revoca:
   - endpoint revoke
   - invalidazione lato Redis (opzionale ma raccomandata)
4. Mapping claim minimi: `sub`, `uid`, `username`, `scope`, `iat`, `exp`.

**Deliverable:** session lifecycle completo e sicuro.

## Fase D - Frontend migration

1. Rimuovere route FE legacy:
   - eliminare `frontend/src/app/api/auth/login/route.ts`
   - eliminare path auth da `frontend/src/lib/jwt.ts` (o rimuovere file se non più usato)
2. Login page:
   - redirect a `/oauth2/authorize` (PKCE + state)
3. Callback page:
   - scambio code -> token via backend endpoint BFF sicuro
4. Proxy middleware:
   - non verifica più JWT firmato in FE
   - controlla solo presenza sessione/cookie BE e stato auth da endpoint BE

**Deliverable:** FE non gestisce più crittografia/token auth business.

## Fase E - Hardening e rollout

1. Cutover secco:
   - disabilitare subito login JWT frontend
   - rifiutare token legacy lato backend
2. Observability:
    - audit login success/fail
    - metriche token refresh/revoke
3. Rollout: dev -> staging -> produzione (senza doppio stack auth attivo).

---

## 6) Pattern da eseguire / da evitare

## Da eseguire (DO)

1. **BFF pattern** per non esporre token sensibili al browser.
2. **Authorization Code + PKCE** per client web/public.
3. **Rotating refresh token** con invalidazione del precedente.
4. **Identifier normalization** centralizzata prima della query utente.
5. **Cookie HttpOnly + Secure + SameSite=Lax/Strict**.
6. **Least-privilege scopes** (`profile:read`, `post:write`, ecc.).
7. **Audit log** su auth events (login, fail, revoke, refresh).
8. **Layering rigido**: `controllers -> services -> repositories`, DTO separati dai model.

## Da evitare (DON'T)

1. Salvare token in `localStorage/sessionStorage`.
2. Continuare a firmare JWT auth nel frontend.
3. Usare grant type password (ROPC) come strategia primaria.
4. Mettere client secret nel frontend.
5. Permettere refresh token riutilizzabili senza rotazione.
6. Gestire parsing identifier in più punti duplicati.

---

## 7) Uso della annotation Redis nel flusso auth

`@RedisCacheable` va usata per dati auth derivati e short-lived, non per oggetti utente mutabili a lungo:

- cache metadata di authorization request/state
- cache validazione nonce anti-replay
- cache introspection/revocation lookup (TTL breve)

**Non usare** per:

- profilo utente completo come source of truth auth
- permessi/ruoli senza strategia di invalidazione

---

## 8) Deep links e redirect matrix

| Caso | Entry point | Redirect | Note |
|---|---|---|---|
| Web route protetta non autenticata | `/direct` | `/login?redirect=/direct` | comportamento attuale da mantenere |
| Avvio login OAuth2 | `/login` | `/oauth2/authorize?...&state=...&code_challenge=...` | PKCE obbligatorio |
| Callback web success | `/auth/callback?code=...&state=...` | path originario (`redirect`) | validare `state` |
| Callback web errore | `/auth/callback?error=...` | `/login?error=oauth_failed` | mostrare messaggio UX |
| Logout | `/api/auth/logout` | `/login` | revoke + clear cookie |
| Mobile deep link success | `instagramree://auth/callback?code=...&state=...` | apertura app + exchange server-side | schema custom app |
| Mobile deep link errore | `instagramree://auth/callback?error=...` | schermata login app | fallback robusto |

### Regole deep link

1. `redirect_uri` in allowlist strict (no wildcard aperti).
2. `state` firmato e con TTL corto.
3. bloccare open redirect (`redirect` solo path interno consentito).

---

## 9) Contratti API (target)

## 9.1 Auth endpoints BE

- `GET /oauth2/authorize`
- `POST /oauth2/token`
- `POST /oauth2/revoke`
- `GET /.well-known/openid-configuration` (se OIDC abilitato)
- `GET /oauth2/jwks`

## 9.2 BFF endpoints FE->BE

- `GET /api/auth/start?redirect=/path`
- `GET /api/auth/callback`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/refresh` (se non automatico)

---

## 10) Data model & migration note

Campi utente minimi necessari:

- `email` (nullable? policy da definire)
- `phone_number` (nullable? policy da definire)
- `username` (unique)
- `password_hash`
- `deleted_at`
- `last_login_at`

Vincoli consigliati:

1. unique index case-insensitive su email/username normalizzati
2. unique su phone normalizzato (se valorizzato)
3. query auth sempre filtrate `deleted_at IS NULL`

---

## 11) Test plan dettagliato

## 11.1 Unit test (BE)

1. Identifier parser:
   - email valida/invalid
   - phone locale/internazionale
   - username fallback
2. UserDetailsService:
   - lookup per ognuno dei 3 identificatori
   - collision handling
3. Token service:
   - claim mapping
   - exp/ttl
   - refresh rotation correctness
4. Redis cache helper:
   - TTL respected
   - invalidation correctness

## 11.2 Integration test (BE)

1. `/oauth2/authorize` -> code flow completo con PKCE.
2. `code -> token` success/failure.
3. refresh token rotation + replay attack test.
4. revoke token + access denied su endpoint protetto.
5. login con:
   - email + password corretti
   - phone + password corretti
   - username + password corretti
   - password errata
   - utente soft-deleted

## 11.3 E2E test (FE + BE)

1. Accesso route protetta -> redirect login -> ritorno su route originaria.
2. Login success con ciascun identificatore.
3. Logout -> route protetta nuovamente bloccata.
4. Session restore dopo refresh pagina.
5. Errore callback OAuth2 (state mismatch) -> blocco accesso + messaggio.
6. Deep link mobile (success/error) con apertura route corretta.

## 11.4 Security test

1. CSRF su endpoint sensibili BFF.
2. Open redirect hardening (`redirect` injection).
3. Token replay su refresh token.
4. Session fixation.
5. Brute force basic throttling/rate limit su login.

---

## 12) Sequenza di migrazione consigliata (cutover secco)

1. Implementare OAuth2 BE completo (AS + Resource Server + controller/service/dto/model).
2. Aggiornare FE login/callback/proxy per usare solo OAuth2.
3. Rimuovere codice JWT legacy FE (`api/auth/login`, verifica JWT in proxy, helper auth legacy).
4. Riconfigurare API protette BE per accettare solo token OAuth2 firmati dal backend.
5. Deploy coordinato FE+BE nello stesso rilascio.
6. Verifica post-deploy su login/logout/refresh/deeplink senza fallback legacy.

---

## 13) Definition of Done

La migrazione è conclusa quando:

1. Il frontend non genera/verifica più JWT auth applicativi.
2. Tutti i login (email/phone/username) passano via OAuth2 BE.
3. Refresh/revoke/logout sono gestiti server-side.
4. Deep links web/mobile funzionano con state validation.
5. Test unit/integration/e2e/security verdi in CI.
6. Nessun endpoint o flusso legacy JWT frontend resta attivo.

