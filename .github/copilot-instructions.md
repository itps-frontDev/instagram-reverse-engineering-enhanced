# Copilot Instructions – Instagram Reverse Engineering (Migrazione Strangler Pattern)

Agisci come uno sviluppatore senior esperto in Next.js (App Router),
TypeScript, Tailwind CSS, Java e Spring Boot.

Il progetto è un gestionale per la gestione di clienti, SPV,
impianti energetici, contratti e dati di produzione energetica.
Stiamo applicando lo **Strangler Pattern** per migrare il backend
da Next.js a Spring Boot in modo incrementale.
L'obiettivo finale è che Next.js contenga esclusivamente la parte
grafica e le Server Actions/Server Components che chiamano gli
endpoint esposti da Spring Boot.

## Methodology
For every new feature or module, follow the Stream Coding v3.5
methodology defined in .github/skills/stream-coding/SKILL.md.
Never write code without a completed spec document that passes
the Spec Gate (9+/10).

---

## BACKEND — Spring Boot

### Regole fondamentali
- Java con Spring Boot
- Ogni modulo CORE deve essere isolato nella propria cartella,
  seguendo la struttura già adottata per i moduli `auth` e `redis`
- Le migrazioni del database sono gestite esclusivamente tramite
  Liquibase — mai modificare il database manualmente
- I repository Next.js esistenti in `frontend/src/repositories/*`
  contengono raw query SQL che fungono da riferimento per
  implementare le query equivalenti nei repository Spring Boot
- Lingua: inglese per codice e nomi, italiano per commenti

### Logging obbligatorio

Ogni classe (Controller, Service, Repository) deve dichiarare
il proprio logger tramite LoggerFactory:

```java
private static final Logger logger = LoggerFactory.getLogger(NomeClasse.class);
```

Livelli da applicare obbligatoriamente:

- **`logger.info`** — inizio e fine di ogni metodo pubblico,
  con i parametri principali in ingresso e l'esito dell'operazione:
  ```java
  logger.info("Fetching product with id: {}", id);
  logger.info("Product fetched successfully: {}", product.getId());
  ```
- **`logger.warn`** — casistiche anomale ma non bloccanti:
  risorsa non trovata, parametro opzionale assente,
  tentativo di accesso a risorsa non di proprietà:
  ```java
  logger.warn("Product not found for id: {}", id);
  ```
- **`logger.error`** — eccezioni catturate, errori di integrazione,
  fallimenti di query; includere sempre il messaggio dell'eccezione:
  ```java
  logger.error("Failed to fetch product with id: {}. Error: {}", id, e.getMessage());
  ```

Regole di logging:
- Mai loggare dati sensibili: password, token, secret, dati personali
- Il logger va dichiarato `private static final` in ogni classe
- Il `@ControllerAdvice` logga sempre l'eccezione ricevuta
  con `logger.error` prima di restituire la response al client
- Usare il placeholder `{}` di SLF4J, mai concatenazione di stringhe

### Workflow obbligatorio per ogni nuovo modulo CORE

Seguire rigorosamente questo ordine per ogni nuovo modulo:

1. **Model**
   - Creare la classe entità JPA nella cartella del modulo
   - Annotare con `@Entity`, `@Table`, `@Id` e mappare
     tutte le colonne esistenti via Liquibase
   - Usare UUID come chiave primaria su tutte le entità
   - Includere sempre `createdAt` e `updatedAt`

2. **Controller**
   - Creare il controller REST nella cartella del modulo
   - Annotare con `@RestController` e `@RequestMapping`
   - Il controller non contiene logica di business:
     delega tutto al service corrispondente
   - Loggare con `logger.info` ogni endpoint invocato,
     indicando il metodo HTTP, il path e i parametri principali
   - Documentare ogni endpoint con commento sul perché
     della scelta del metodo HTTP e del path

3. **Service**
   - Creare l'interfaccia e la sua implementazione
   - Tutta la business logic vive esclusivamente nel service
   - Il service chiama il repository per accedere ai dati
   - Loggare con `logger.info` inizio e fine di ogni operazione,
     con `logger.warn` per casistiche anomale e `logger.error`
     per eccezioni
   - Mai chiamate al database dirette fuori dal repository

4. **Repository**
   - Creare l'interfaccia che estende `JpaRepository`
   - Prendere come riferimento le raw query SQL presenti
     in `frontend/src/repositories/*` per implementare
     le query equivalenti in JPQL o query methods
   - Mai SQL concatenato come stringa: usare sempre
     parametri named (`@Query` con `:param`) o query methods
   - Loggare con `logger.info` le query eseguite e i parametri
     principali; `logger.error` in caso di eccezione

5. **Classi accessorie (se necessarie)**
   - **DTO**: classi di trasferimento dati per request/response,
     mai esporre direttamente l'entità JPA all'esterno
   - **Eccezioni**: classi custom che estendono
     `RuntimeException`, gestite da un `@ControllerAdvice`
     globale per risposta uniforme degli errori
   - **Config**: configurazioni specifiche del modulo
     (es. bean, costanti, security config)

6. **Struttura cartelle del modulo**
   ```
   src/main/java/.../
   ├── auth/          ← riferimento esistente
   ├── redis/         ← riferimento esistente
   └── [nuovo-modulo]/
       ├── controller/
       ├── service/
       │   └── impl/
       ├── repository/
       ├── model/
       ├── dto/
       ├── exception/
       └── config/    (se necessario)
   ```

7. **Aggiornamento Postman**
   - Dopo aver creato e verificato il modulo, aggiornare
     la cartella `/postman` con le nuove chiamate API
   - Seguire la struttura e il naming delle collection esistenti
   - Includere esempi di request/response per ogni endpoint
   - Aggiungere variabili d'ambiente per baseUrl e token
     coerentemente con quelle già presenti

### Sicurezza — OWASP Top 10
- SQL Injection: usare esclusivamente query parametrizzate
  JPA/JPQL, mai concatenazione di stringhe
- Broken Access Control: ogni service verifica sempre
  l'ownership della risorsa prima di restituirla o modificarla
- IDOR: UUID come PK su tutte le entità
- Sensitive Data Exposure: secret solo in variabili d'ambiente,
  mai esporre stack trace o dettagli interni nella response,
  mai loggare token o password
- Brute Force: rate limiting sugli endpoint di autenticazione
- Segnalare esplicitamente qualsiasi pattern che potrebbe
  introdurre vulnerabilità OWASP Top 10

### Gestione degli errori
- Ogni modulo ha le proprie eccezioni custom
- Un `@ControllerAdvice` globale intercetta tutte le eccezioni
  e restituisce sempre una response strutturata:
  `{ success, data?, error?, message? }`
- Il `@ControllerAdvice` logga sempre con `logger.error`
  prima di costruire la response
- Mai esporre stack trace o dettagli interni al client

---

## FRONTEND — Next.js

### Regole fondamentali
- Next.js App Router con TypeScript STRICT
- Tailwind CSS (NO CSS puro, NO inline styles)
- Validazione: Zod obbligatorio su tutti gli input e output
- Lingua: inglese per UI e messaggi utente, italiano per commenti
  codice, inglese per codice e nomi
- Next.js contiene esclusivamente la parte grafica:
  nessuna business logic, nessun accesso diretto al database
- Nessun sistema di ruoli: la gestione degli accessi
  è demandata interamente a Spring Boot

### Struttura features

Ogni modulo CORE ha la propria cartella dentro `/features`:

```
frontend/src/
├── repositories/         ← repository legacy con raw query (in dismissione)
│   └── [modulo].ts
└── features/
    └── [modulo]/
        ├── schema.ts     ← tutti gli schema Zod del modulo
        └── actions.ts    ← tutte le Server Actions del modulo
```

- **`schema.ts`**: definisce e centralizza tutti gli schema Zod
  per validazione di input e output del modulo
- **`actions.ts`**: contiene le Server Actions che chiamano
  gli endpoint Spring Boot corrispondenti; ogni action legge
  i cookie di sessione, inietta il Bearer token nell'header
  Authorization e restituisce `{ success, data?, error? }`

### Rendering & Data fetching
- Preferire Server Components per il fetch dei dati
- I Server Components chiamano Spring Boot direttamente
  via fetch server-to-server (zero CORS, zero latenza aggiuntiva)
- Le Server Actions gestiscono tutte le mutazioni
  (create, update, delete) verso Spring Boot
- NON usare API Routes (`/api/*`) salvo integrazioni esterne
  esplicite — ogni nuova API route è un errore di architettura
- Nessuna logica di business nei Client Components
- Client Components SOLO per interattività UI pura

### Pattern di fetch autenticato

Ogni fetch verso Spring Boot segue questo pattern:

```ts
// Lettura — Server Component
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

const res = await fetch(`${process.env.SPRING_API_BASE_URL}/api/priv/...`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  next: { tags: ['nome-tag'] }, // per revalidazione cache
});

// Mutazione — Server Action
'use server';
export async function createEntityAction(data: EntityInput) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

  const res = await fetch(`${process.env.SPRING_API_BASE_URL}/api/priv/...`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) return { success: false, error: await res.json() };

  revalidateTag('nome-tag');
  return { success: true };
}
```

### Gestione degli errori
- Le Server Actions restituiscono sempre un oggetto tipizzato:
  `{ success: boolean, data?: T, error?: string }`
- Usare Error Boundaries per errori nei Client Components
- Mai esporre dettagli interni degli errori o stack trace al client
- `redirect()` di Next.js deve sempre essere chiamato
  FUORI da blocchi `try/catch` — lancia un'eccezione internamente

---

## Strangler Pattern — Workflow di migrazione

Ogni volta che viene completato un modulo backend Spring Boot
(con tutto il workflow definito sopra) e sul frontend sono state
predisposte le `actions.ts` corrispondenti, si procede con
la sostituzione degli endpoint legacy:

### Fasi della migrazione per ogni modulo

1. **Backend pronto**: modulo Spring Boot completo
   (model → controller → service → repository → DTO/eccezioni)
   e collection Postman aggiornata

2. **Frontend predisposto**: `features/[modulo]/actions.ts`
   con le Server Actions che chiamano i nuovi endpoint Spring Boot
   e `features/[modulo]/schema.ts` con gli schema Zod aggiornati

3. **Sostituzione**: sostituire nei componenti le chiamate
   ai vecchi endpoint Next.js con le nuove Server Actions
   o con fetch diretti nei Server Components verso Spring Boot

4. **Pulizia — eliminare obbligatoriamente**:
   - Le API Route Next.js (`/app/api/[modulo]`) corrispondenti
   - Il file repository legacy (`frontend/src/repositories/[modulo].ts`)
   - Le raw query SQL Next.js non più utilizzate
   - Ogni file o funzione ridondante ora gestita da Spring Boot

5. **Verifica**: dopo la pulizia, assicurarsi che Next.js
   non contenga più nessuna logica relativa al modulo migrato,
   solo componenti React che consumano le Server Actions

6. **Migrazione degli endpoint frontend a UUID**: ogni volta che si migra
   un modulo verso Spring Boot, TUTTI gli endpoint nel frontend
   devono utilizzare UUID come identificativo e non più ID numerici.
   Questo include:
   - URL parametrizzati: `/path/[uuid]` anziché `/path/[id]`
   - Query string: `?id=uuid` anziché `?id=123`
   - Variabili nei parametri delle Server Actions: `uuid` anziché `id`
   - Payload JSON: `{ uuid: "..." }` anziché `{ id: 123 }`
   - Cache tags: usare UUID negli identificatori di invalidazione cache
   - Le path di routing del frontend devono essere sincronizzate
     con gli UUIDs restituiti dal backend Spring Boot

### Regola fondamentale della migrazione
> Non eliminare il codice legacy prima che il corrispondente
> modulo Spring Boot sia verificato e funzionante in staging.
> La sostituzione avviene sempre in un unico commit atomico
> per modulo: mai lasciare il progetto in uno stato ibrido
> non intenzionale a metà migrazione.

---

## Componenti

- Componenti piccoli e riutilizzabili
- Separare UI, logica e data fetching in layer distinti
- Componenti specifici di una route in `_components/`
  dentro la route stessa
- Componenti condivisi globalmente in `/components/`
- Client Components SOLO se necessario (grafici, interazioni utente)
- Debounce per ricerche e filtri
- Grafici renderizzati in Client Components separati dai dati

## Coding style

- Codice leggibile e commentato
- Evitare duplicazioni
- Segnalare scelte tecniche discutibili e proporre alternative
- Nomi chiari e significativi per variabili, funzioni e componenti
- Evitare logica complessa nei componenti, spostarla
  in funzioni dedicate o nelle Server Actions
- Commenti nel codice: spiegare SEMPRE il perché delle scelte

---

## Integrazione con lo stato attuale di questo repository

### Comandi operativi reali (monorepo)

- Frontend (da `frontend/`):
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm test`
  - singolo test file: `pnpm exec tsx --test src/percorso/file.test.ts`
- Backend (da `backend/`):
  - `./gradlew bootRun`
  - `./gradlew build`
  - `./gradlew test`
  - singolo test: `./gradlew test --tests "it.evodev.instagram.InstagramApplicationTests.contextLoads"`
  - su Windows usare `gradlew.bat`

### Architettura effettiva corrente (transizione attiva)

- Il progetto è in monorepo:
  - `frontend/` (Next.js 16 App Router)
  - `backend/` (Spring Boot 3.4, Java 21)
- Ad oggi molta logica di dominio è ancora in:
  - `frontend/src/app/api/**/route.ts`
  - `frontend/src/repositories/*Repository.ts`
- I moduli backend attualmente consolidati sono principalmente
  `auth` e `redis`; usare questi come riferimento strutturale.

### Convenzioni dati già in uso (da rispettare finché esiste il legacy)

- In `frontend/src/repositories/*` le query usano placeholder `?`;
  la conversione verso PostgreSQL `$1...` è centralizzata in
  `frontend/src/lib/db.ts`
- Usare `withTransaction(...)` per scritture multi-step
- Per ottenere ID da insert PostgreSQL, includere `RETURNING id`
- Soft delete come comportamento standard: `deleted_at IS NULL`
- Normalizzazione a lowercase per campi identitari
  (`email`, `username`, `phone_number`) prima di lookup/salvataggio

### Note pratiche Next.js presenti nel codice attuale

- Route/API che usano moduli Node-only (`pg`, `fs`, bcrypt, ecc.)
  devono mantenere `export const runtime = 'nodejs'`
- Media locali in `frontend/data/uploads` e delivery via
  `/api/media/[...path]` con controllo accessi a runtime nel handler
- Flusso auth frontend attuale basato su cookie JWT e chiamate
  agli endpoint Spring `/api/public/auth/*` e `/api/priv/auth/*`

### Mappatura API legacy per migrazione

- Per pianificare la migrazione da Next API Routes a Spring Boot,
  usare come base `reports/api_routes.csv`
- Il file contiene la mappatura delle route Next (`/api/*`) da
  replicare lato backend e i metadati utili (`methods`, `uses_db`,
  `uses_fs`, `requires_jwt`, `runtime_nodejs`)
- Prima di ogni migrazione modulo, verificare sempre allineamento tra:
  - route reali in `frontend/src/app/api/**/route.ts`
  - righe presenti in `reports/api_routes.csv`
- Ogni volta che una Next API route viene aggiunta, rimossa o modificata,
  aggiornare nella stessa attività anche `reports/api_routes.csv`
- Stato attuale verificato:
  - presente in Next ma mancante nel CSV: `/api/feed/comments`
  - presenti nel CSV ma non più presenti in Next:
    `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Le route auth mancanti in Next possono essere già migrate verso
  Spring Boot: trattarle come candidate già migrate, ma confermare
  sempre l'effettivo endpoint equivalente backend prima di rimuovere
  riferimenti legacy.
