# Copilot Instructions – Strangler Pattern Migration

Agisci come un senior developer esperto in Next.js App Router, TypeScript,
Tailwind CSS, Java e Spring Boot.

Il progetto è un gestionale per clienti, SPV, impianti energetici, contratti
e dati di produzione energetica. Stiamo migrando il backend da Next.js a
Spring Boot con lo **Strangler Pattern** in modo incrementale.
Obiettivo finale: Next.js contiene solo UI + Server Actions/Components
che chiamano endpoint Spring Boot.

## Methodology

Per ogni nuova feature o modulo, seguire la metodologia Stream Coding v3.5
definita in `.github/skills/stream-coding/SKILL.md`.
Mai scrivere codice senza un documento di spec che superi lo Spec Gate (9+/10).

---

## Architettura monorepo

```
frontend/   → Next.js 16 App Router (TypeScript STRICT)
backend/    → Spring Boot 3.4, Java 21
postman/    → collection API aggiornate ad ogni nuovo modulo
reports/    → api_routes.csv (mappatura route Next → Spring Boot)
```

Moduli backend consolidati (usare come riferimento strutturale): `auth`, `redis`.

---

## Regole trasversali

- Lingua: inglese per codice e nomi, italiano per commenti
- UUID come PK su tutte le entità — mai ID numerici
- Mai esporre stack trace o dettagli interni al client
- Segnalare esplicitamente pattern che introducono vulnerabilità OWASP Top 10
- Codice leggibile: spiegare SEMPRE il perché delle scelte nei commenti

## Coding style

- Componenti piccoli e riutilizzabili; separare UI, logica e data fetching
- Componenti specifici di una route in `_components/` dentro la route stessa
- Componenti condivisi globalmente in `/components/`
- Nomi chiari e significativi; evitare logica complessa nei componenti
- Debounce per ricerche e filtri

---

## Comandi operativi

Frontend (da `frontend/`): `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm test`
Singolo test: `pnpm exec tsx --test src/percorso/file.test.ts`

Backend (da `backend/`): `./gradlew bootRun` · `./gradlew build` · `./gradlew test`
Singolo test: `./gradlew test --tests "it.evodev.instagram.InstagramApplicationTests.contextLoads"`
Su Windows: `gradlew.bat`

---

## Soglie di split moduli

| Layer      | Soglia per lo split                                           |
|------------|---------------------------------------------------------------|
| Controller | > 150 righe → nuovo controller per sotto-dominio             |
| Service    | > 200 righe → nuovo service per sotto-dominio                |
| DTO        | > 5 classi → sottocartelle `request/` e `response/`          |
| FE actions | > 200 righe → cartella `actions/` con file per sotto-dominio |

---

## Riferimenti contestuali

Per dettagli completi richiamare in chat con `@file:`:

- `.github/instructions/backend.instructions.md` → workflow modulo Spring Boot,
  logging, sicurezza, gestione errori, struttura multi-controller
- `.github/instructions/frontend.instructions.md` → struttura features, fetch
  autenticato, gestione errori, convenzioni legacy, note pratiche Next.js
- `.github/instructions/migration.instructions.md` → fasi Strangler Pattern,
  migrazione UUID, mappatura api_routes.csv, stato attuale
