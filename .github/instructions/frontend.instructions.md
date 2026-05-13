# Frontend — Next.js (Dettaglio)

> Richiamare con `#file:.github/instructions/frontend.instructions.md`
> quando si lavora su codice frontend.

---

## Regole fondamentali

- Next.js App Router con TypeScript STRICT
- Tailwind CSS — NO CSS puro, NO inline styles
- Zod obbligatorio su tutti gli input e output
- Next.js contiene esclusivamente la parte grafica: zero business logic,
  zero accesso diretto al database
- Nessun sistema di ruoli lato frontend: gestione accessi demandata a Spring Boot
- Client Components SOLO per interattività UI pura

---

## Struttura features

```
frontend/src/
├── repositories/              ← legacy raw query (in dismissione)
└── features/
    └── [modulo]/
        ├── schema.ts          ← tutti gli schema Zod (input + output)
        ├── actions.ts         ← Server Actions (o cartella actions/ se > 200 righe)
        ├── types.ts           ← tipi TypeScript che mappano 1:1 i DTO backend
        └── index.ts           ← barrel export (solo se consumata in più punti)
```

### Struttura multi-file (quando actions.ts supera ~200 righe)

```
features/[modulo]/
├── index.ts
├── schema.ts
├── types.ts
└── actions/
    ├── [modulo].actions.ts        ← fetch, lettura, query
    ├── [sotto-dominio].actions.ts ← es. follow.actions.ts, edit.actions.ts
    └── ...
```

Regole:
- `schema.ts` rimane sempre unico per modulo
- `index.ts` solo quando la feature è consumata in più punti; i consumer
  importano sempre da `@/features/[modulo]`, mai dai sotto-file direttamente
- `types.ts` mappa 1:1 i DTO di risposta del backend Spring Boot

### Sincronizzazione Backend ↔ Frontend

| Backend                           | Frontend                                            |
|-----------------------------------|-----------------------------------------------------|
| Nuovo `XxxController`             | Nuova action in `[modulo].actions.ts` o sotto-file  |
| Nuovo DTO response                | Nuovo tipo in `types.ts`                            |
| Nuovo DTO request con validazione | Nuovo schema Zod in `schema.ts`                     |
| Nuovo sotto-dominio (es. follow)  | Eventuale nuovo `follow.actions.ts`                 |

---

## Rendering & Data fetching

- Preferire Server Components per il fetch dei dati
- Server Components → fetch server-to-server verso Spring Boot (zero CORS)
- Server Actions → tutte le mutazioni (create, update, delete)
- NON usare API Routes (`/api/*`) salvo integrazioni esterne esplicite:
  ogni nuova API route è un errore di architettura
- Nessuna logica di business nei Client Components

---

## Pattern di fetch autenticato

```ts
// Lettura — Server Component
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

const res = await fetch(`${process.env.SPRING_API_BASE_URL}/api/priv/...`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  next: { tags: ['nome-tag'] },
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

---

## Gestione degli errori

- Server Actions restituiscono sempre: `{ success: boolean, data?: T, error?: string }`
- Error Boundaries per errori nei Client Components
- Mai esporre dettagli interni o stack trace al client
- `redirect()` di Next.js va chiamato FUORI da blocchi `try/catch`

---

## Convenzioni legacy (da rispettare finché esiste il legacy)

- Query in `frontend/src/repositories/*` usano placeholder `?`;
  conversione verso PostgreSQL `$1...` centralizzata in `frontend/src/lib/db.ts`
- Usare `withTransaction(...)` per scritture multi-step
- Per ID da insert PostgreSQL includere `RETURNING id`
- Soft delete standard: `deleted_at IS NULL`
- Normalizzare a lowercase i campi identitari (`email`, `username`, `phone_number`)
  prima di lookup/salvataggio

---

## Note pratiche Next.js (codice attuale)

- Route/API che usano moduli Node-only (`pg`, `fs`, bcrypt…) devono avere
  `export const runtime = 'nodejs'`
- Media locali in `frontend/data/uploads`, delivery via `/api/media/[...path]`
  con controllo accessi a runtime nel handler
- Auth: cookie JWT + endpoint Spring `/api/public/auth/*` e `/api/priv/auth/*`
