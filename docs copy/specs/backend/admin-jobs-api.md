# Admin Jobs API

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-11

---

## Scopo

Espone endpoint HTTP per triggerare manualmente i job schedulati. Ogni endpoint è asincrono: risponde `202 Accepted` immediatamente e il job prosegue in background.

---

## Vincolo di deployment: istanza singola

Il monitoraggio del progresso job usa storage **in-memory** sulla singola istanza JVM. Questa spec è valida **esclusivamente per deployment single-instance**.

In caso di deployment multi-istanza, il progress storage va migrato su store condiviso (Redis o tabella DB) e tutte le richieste `/api/priv/admin/jobs/*` devono essere instradate allo stesso nodo via sticky routing nginx.

---

## Struttura path

```
/api/priv/admin/...    →  richiedono autenticazione (Spring Security — enforcement autoritativo)
/api/public/...        →  accessibili senza autenticazione
```

Spring Security è il **solo** layer di enforcement per `/api/priv/`. Nginx può aggiungere controlli a livello di rete come difesa in profondità, ma non lo sostituisce.

---

## Schema comune delle risposte

### 202 Accepted — job avviato

```json
{ "job": "indexing-all", "runId": "550e8400-...", "triggeredAt": "2026-05-10T10:30:00Z" }
```

### 409 Conflict — job già in esecuzione

```json
{ "error": "JOB_LOCKED", "job": "indexing-all" }
```

Restituito quando ShedLock ha già acquisito il lock. **Eccezione:** `marketplace/sync` e `orders/sync` non restituiscono mai `409` — vedi §Strategia lock multi-marketplace.

### 400 Bad Request

Restituito solo per `POST /api/priv/admin/indexing/{dataSource}` se `{dataSource}` non è un valore valido dell'enum `DataSource` o il datasource non è abilitato nel DB.

---

## Endpoint

| Metodo | Path | Job ID | Lock ShedLock | 409 |
|---|---|---|---|---|
| POST | `/api/priv/admin/indexing` | `indexing-all` | `products-indexing-cron` | sì |
| POST | `/api/priv/admin/indexing/{dataSource}` | `indexing-{dataSource}` | `products-indexing-{dataSource}` | sì |
| POST | `/api/priv/admin/publications/refresh` | `publications-refresh` | `publication-refresh` | sì |
| POST | `/api/priv/admin/publications/prices` | `publications-prices` | `publication-price-refresh` | sì |
| POST | `/api/priv/admin/marketplace/sync` | `marketplace-sync` | `marketplace-sync-{code}` per marketplace | no |
| POST | `/api/priv/admin/orders/sync` | `orders-sync` | `orders-sync-{code}` per marketplace | no |
| POST | `/api/priv/admin/images/sync` | `images-sync` | `images-lello-sync` | sì |
| GET | `/api/priv/admin/jobs/{runId}` | — | — | — |
| GET | `/api/priv/admin/jobs/{runId}/stream` | — | — | — |

**Path parameter `{dataSource}`:** `TAXI`, `LELLO`, `CARMECCANICA`, `C_AND_C`. `MANUAL` è escluso.

**`GET /jobs/{runId}`:** ritorna `JobProgress` completo o `404` se il runId non esiste / è scaduto dalla memoria.

**`GET /jobs/{runId}/stream`:** apre un `SseEmitter`. Invia immediatamente `snapshot` poi eventi incrementali. Vedi [job-progress.md §SSE](job-progress.md#sse--tipi-di-evento).

---

## Meccanismo di esecuzione asincrona

Per i job con **lock globale** (`indexing`, `publications`, `images`):
- Lock acquisito nel controller → `tracker.start()` nel controller → job sottomesso al `TaskExecutor` → `202`
- Lock non acquisito → `409` (job non avviato)

> `tracker.start()` deve essere chiamato nel controller, prima di `executor.submit()`. Se chiamato dentro la lambda, il client riceverebbe il `runId` nel `202` ma una chiamata immediata a `GET /jobs/{runId}` potrebbe tornare `404`. Vedi [job-dashboard-backend.md#strumentazione-job-schedulati](job-dashboard-backend.md#strumentazione-job-schedulati).

Per i job **multi-marketplace** (`marketplace/sync`, `orders/sync`):
- Nessun lock a livello di controller → risponde sempre `202`
- I lock per-marketplace vengono acquisiti e rilasciati internamente durante l'iterazione

Il trigger manuale e la run schedulata condividono gli stessi lock name: non possono sovrapporsi.

---

## Strategia lock per job multi-marketplace

```
Per ogni marketplace abilitato:
  1. Tenta acquisto lock marketplace-sync-{code} (o orders-sync-{code})
  2. Lock acquisito   → esegui sync → rilascia lock
  3. Lock non acquisito → marketplace.status = SKIPPED_LOCKED → continua col prossimo
Fine iterazione → tracker.complete(runId, resultMap)
```

Il `result` al completamento è una mappa per marketplace:

```json
{
  "BRICOBRAVO": { "status": "SYNCED", "synced": 342, "failed": 2 },
  "AMAZON":     { "status": "SKIPPED_LOCKED" },
  "EBAY":       { "status": "FAILED", "error": "Connection timeout" }
}
```

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Attendere il completamento del job prima di rispondere | Delegare a `TaskExecutor` e rispondere `202` | I job durano minuti; una connessione aperta causerebbe timeout |
| Acquisire il lock ShedLock dentro il thread del job | Acquisire nel controller, prima di delegare | Altrimenti tra `202` e acquisizione lock un secondo trigger verrebbe accettato |
| Creare lock con name diversi dallo scheduler | Riusare i lock name esatti | Lock diversi permetterebbero sovrapposizione manuale/schedulata |
| Restituire `409` per `marketplace/sync` quando un solo marketplace è locked | Saltare quel marketplace, continuare con gli altri | Ogni marketplace ha lock indipendente |
| Esporre endpoint sotto `/api/public/` | Usare sempre `/api/priv/admin/` | Questi endpoint avviano processi pesanti e richiedono autenticazione |
| Aggiungere un nuovo endpoint trigger senza aggiornare `KnownJob` | Aggiornare `KnownJob` contestualmente — vedi [job-dashboard-backend.md#costante-knownjob](job-dashboard-backend.md#costante-knownjob) | Il nuovo job non appare nel dashboard finché non è registrato nella costante |

---

## Error Handling Matrix

| Caso | Risposta HTTP | Logging |
|---|---|---|
| Lock ShedLock già acquisito (lock globale) | `409 Conflict` body `JOB_LOCKED` | WARN |
| `{dataSource}` non valido o disabilitato | `400 Bad Request` | — |
| Eccezione non gestita nel job (background) | Nessun impatto sulla risposta già consegnata | ERROR con stack trace |
| Marketplace lock già acquisito (iterazione multi-marketplace) | `status = SKIPPED_LOCKED` nel result | WARN con marketplace code |
| `runId` non trovato (`GET /jobs/{runId}`) | `404 Not Found` | — |

---

## Rischi accettati

| Rischio | Motivazione |
|---|---|
| `result` non tipizzato in OpenAPI | API admin interna; struttura in [job-progress.md §Payload result](job-progress.md#payload-result-per-job) |
| Nessuna idempotency key sui trigger | La sola protezione attuale è il lock ShedLock |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| `JobProgressTracker`, SSE, data model, payload result | [job-progress.md](job-progress.md) |
| Dashboard: `KnownJob`, `GET /api/priv/admin/jobs` | [job-dashboard-backend.md](job-dashboard-backend.md) |
| Lock ShedLock, sorgenti dati, `DataSource` | [products/indexer.md](products/indexer.md) |
| `PublicationRefreshJob` | [marketplace/publication-engine.md](marketplace/publication-engine.md) |
| `MarketplaceService.syncAll()` | [marketplace/sync-engine.md](marketplace/sync-engine.md) |
| `OrderSyncService` | [orders/orders-module-spec.md](orders/orders-module-spec.md) |
| `LelloImageSyncService` | [products/indexer.md](products/indexer.md) — §Sincronizzazione immagini LELLO |
