# Job Progress

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-11

---

## Scopo

Fornisce un meccanismo uniforme per tracciare l'avanzamento dei job schedulati: progresso in memoria, log strutturato per batch, e streaming in tempo reale via SSE.

> **Vincolo deployment:** storage in-memory sulla singola istanza JVM — valido esclusivamente per deployment single-instance.

---

## Modello dati: `JobProgress`

```json
{
  "runId": "550e8400-e29b-41d4-a716-446655440000",
  "jobName": "indexing-all",
  "status": "RUNNING",
  "phases": {
    "total": 4,
    "completed": 1,
    "current": {
      "name": "LELLO",
      "processed": 1500,
      "total": 10000,
      "percent": 15
    }
  },
  "overallPercent": 28,
  "startedAt": "2026-05-10T10:30:00Z",
  "completedAt": null,
  "result": null,
  "error": null
}
```

| Campo | Tipo | Descrizione |
|---|---|---|
| `runId` | UUIDv4 stringa | Identificatore univoco del run — generato con `UUID.randomUUID()` |
| `jobName` | stringa | Identificatore del job (vedi §Fasi per job) |
| `status` | enum | Vedi §State machine |
| `phases.total` | intero ≥ 0 | Numero totale di fasi |
| `phases.completed` | intero | Fasi completate |
| `phases.current` | oggetto \| null | null se nessuna fase attiva |
| `phases.current.name` | stringa | Nome fase attiva (es. `TAXI`, codice marketplace) |
| `phases.current.processed` | long | Elementi processati nella fase |
| `phases.current.total` | long | Totale elementi nella fase |
| `phases.current.percent` | intero 0–100 | `floor(processed / total * 100)` |
| `overallPercent` | intero 0–100 | Vedi §Calcolo overallPercent |
| `startedAt` | ISO 8601 UTC | Timestamp avvio |
| `completedAt` | ISO 8601 UTC \| null | Timestamp completamento (successo o errore) |
| `result` | oggetto \| null | Presente solo se `COMPLETED` — vedi §Payload result |
| `error` | stringa \| null | Presente solo se `FAILED` |

---

## State machine

```
PENDING → RUNNING → COMPLETED
                 ↘ FAILED
```

| Status | phases.current | overallPercent | completedAt | result | error |
|---|---|---|---|---|---|
| `PENDING` | null | 0 | null | null | null |
| `RUNNING` | oggetto non-null | 0–99 (formula) | null | null | null |
| `COMPLETED` | null | 100 (fisso) | valorizzato | oggetto | null |
| `FAILED` | null | congelato all'ultimo valore | valorizzato | null | stringa |

---

## Calcolo `overallPercent`

```
Se phases.total == 0 → status = COMPLETED, overallPercent = 100  (NO_WORK)

Altrimenti (RUNNING):
  overallPercent = floor(
    (phases.completed / phases.total) * 100
    + (phases.current?.percent ?? 0) / phases.total
  )
```

---

## Fasi per job

| Job | Fasi (in ordine) | Unità di avanzamento |
|---|---|---|
| `indexing-all` | Una fase per datasource abilitato: TAXI, LELLO, CARMECCANICA, C_AND_C | prodotto per batch da 500 |
| `indexing-{dataSource}` | Una fase: il datasource specificato | prodotto per batch da 500 |
| `publications-refresh` | Una fase: `REFRESH` | ProductMarketplace per batch DB |
| `publications-prices` | Una fase: `PRICES` | ProductMarketplace per batch DB |
| `marketplace-sync` | Una fase per marketplace abilitato | pubblicazione sincronizzata per batch |
| `orders-sync` | Una fase per marketplace abilitato | ordine importato per batch |
| `images-sync` | Una fase: `LELLO_FTP` | file scaricato (1 file = 1 unità) |

> **Regola di estensione:** ogni nuovo job aggiunto a questa tabella deve essere registrato anche in `KnownJob` nel controller del dashboard — vedi [job-dashboard-backend.md](job-dashboard-backend.md). Senza questa aggiunta il job non appare nel dashboard.

---

## Payload `result` per job

| Job | Struttura result |
|---|---|
| `indexing-all` | `Map<String dataSourceName, IndexingReport>` |
| `indexing-{dataSource}` | `IndexingReport` — campi: `created`, `updated`, `deactivated`, `failed`, `duration` |
| `publications-refresh` | `{ "created": int, "updated": int }` |
| `publications-prices` | `{ "updated": int }` |
| `marketplace-sync` | `Map<String marketplaceCode, { "status": "SYNCED\|SKIPPED_LOCKED\|FAILED", "synced": int, "failed": int, "error": string\|null }>` |
| `orders-sync` | `Map<String marketplaceCode, { "status": "SYNCED\|SKIPPED_LOCKED\|FAILED", "created": int, "updated": int, "skipped": int, "error": string\|null }>` |
| `images-sync` | `{ "downloaded": int, "skipped": int, "failed": int }` |

---

## Componente: `JobProgressTracker`

Bean Spring `@Component` singleton. Mantiene:
- `ConcurrentHashMap<String, JobProgress>` — stato dei run
- `ConcurrentHashMap<String, SseEmitter>` — emitter SSE attivi (max 1 per runId)

### API pubblica

```java
String start(String jobName, int totalPhases);     // genera runId; se totalPhases==0 → COMPLETED immediato
void beginPhase(String runId, String phaseName, long phaseTotal);
void advance(String runId, long batchSize);
void completePhase(String runId);
void complete(String runId, Object result);
void fail(String runId, String error);
Optional<JobProgress> get(String runId);
SseEmitter subscribe(String runId);               // max 1 emitter attivo per runId
```

### Contratti chiave

- `start()`: se `totalPhases == 0` → imposta `COMPLETED / overallPercent=100 / completedAt=now()` direttamente.
- `beginPhase()`: porta `status` da `PENDING` a `RUNNING` alla prima chiamata; imposta `phases.current`; ricalcola `overallPercent`; invia evento SSE `phase`.
- `advance()`: incrementa `phases.current.processed`; ricalcola percentuali; invia evento SSE `progress`. Thread-safe.
- `completePhase()`: incrementa `phases.completed`; azzera `phases.current`; invia `phase-completed`.
- `complete()`: imposta `COMPLETED / overallPercent=100`; invia `completed`; chiude emitter.
- `fail()`: imposta `FAILED`; congela `overallPercent`; invia `failed`; chiude emitter con errore. Se `error` è `null`, il tracker usa `"UNKNOWN_ERROR"` come fallback — i chiamanti passano `e.getMessage()` senza controllare il null.
- `subscribe()`: se esiste un emitter attivo lo chiude (via `complete()`, non `completeWithError`); crea nuovo emitter; invia `snapshot` immediato; gestisce race condition post-registrazione (se job già terminato → invia evento terminale e chiude emitter atomicamente).

### Lifecycle emitter

- Timeout: `${fatellisync.jobs.sse-timeout-ms:600000}` (10 min). Se scade durante un job in corso → emitter rimosso, job continua in background.
- Heartbeat: ogni 30 secondi su tutti gli emitter attivi.
- Cleanup run terminali: ogni 15 minuti, rimuove `COMPLETED`/`FAILED` con `completedAt` > 1 ora fa. Run `RUNNING` non vengono mai rimossi automaticamente.

---

## SSE — Tipi di evento

| Evento | Quando | Payload |
|---|---|---|
| `snapshot` | Al subscribe, immediato | `JobProgress` completo |
| `phase` | Inizio nuova fase | `{ "phase": "LELLO", "total": 10000 }` |
| `progress` | Ogni `advance()` | `{ "phase", "processed", "total", "percent", "overallPercent" }` |
| `phase-completed` | Fine fase | `{}` |
| `completed` | Job terminato con successo | `{ "overallPercent": 100, "result": {...} }` |
| `failed` | Job terminato con errore | `{ "error": "messaggio" }` |
| `heartbeat` | Ogni 30 secondi | `{}` |

Il client deve chiamare `eventSource.close()` alla ricezione di `completed` o `failed` — `EventSource` non si chiude automaticamente su eventi terminali.

Se il client si riconnette: chiama nuovamente `GET /jobs/{runId}/stream`; riceve `snapshot` con stato corrente. Non è implementato Last-Event-ID né replay.

---

## Formato log

```
INFO  [job-progress] runId=abc123 job=indexing-all phase=LELLO STARTED total=10000
INFO  [job-progress] runId=abc123 job=indexing-all phase=LELLO processed=1500 total=10000 percent=15 overall=28
INFO  [job-progress] runId=abc123 job=indexing-all COMPLETED duration=PT1M23S
ERROR [job-progress] runId=abc123 job=indexing-all FAILED error="Connection refused: ftp.lello.it"
```

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Chiamare `count()` e aprire lo stream su connessioni separate | `count()`, poi raccogliere tutto in lista, poi elaborare | Un catalogo che cambia tra count e stream porta `processed > total` |
| Lanciare eccezione in `advance()` se nessun emitter è connesso | Verificare emitter prima di inviare, ignorare se assente | Il job deve girare anche senza client SSE |
| Usare `synchronized` sul tracker per ogni `advance()` | `ConcurrentHashMap` + operazioni atomiche | `advance()` viene chiamato centinaia di volte al minuto |
| Rimuovere run `RUNNING` nel cleanup schedulato | Rimuovere solo run terminali più vecchi di 1 ora | Un run attivo non deve essere cancellato |
| Chiamare `completeWithError` sull'emitter sostituito | `remove` dalla map + `complete()` silenziato | `completeWithError` propaga attraverso Spring MVC causando 500 sulla nuova richiesta SSE |

---

## Error Handling Matrix

| Caso | Risposta |
|---|---|
| `runId` non trovato (`get` / `subscribe`) | `Optional.empty()` → controller risponde `404` |
| SSE emitter timeout durante job in corso | Emitter rimosso, job continua; client può riconnettersi |
| Eccezione nel job (thread background) | `tracker.fail(runId, error)` → evento `failed` → log ERROR con stack trace |
| `count()` lancia eccezione | `tracker.fail(runId, error)`, job non parte |
| Eccezione invio evento SSE | Emitter rimosso dalla map, job continua senza SSE; log WARN |
| `phases.total == 0` in `start()` | `COMPLETED` immediato, `overallPercent = 100` |

---

## Rischi accettati

| Rischio | Motivazione |
|---|---|
| `result` non tipizzato in OpenAPI | API admin interna; struttura descritta nel §Payload result sopra |
| Un secondo subscriber disconnette il primo | Strumento admin single-user — comportamento accettabile |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Endpoint HTTP trigger e lock ShedLock | [admin-jobs-api.md](admin-jobs-api.md) |
| Dashboard: `KnownJob`, `GET /api/priv/admin/jobs` | [job-dashboard-backend.md](job-dashboard-backend.md) |
| `IndexingStrategy`, `ProductIndexer`, ShedLock | [products/indexer.md](products/indexer.md) |
| `PublicationRefreshJob` | [marketplace/publication-engine.md](marketplace/publication-engine.md) |
| `MarketplaceService.syncAll()` | [marketplace/sync-engine.md](marketplace/sync-engine.md) |
| `OrderSyncService` | [orders/orders-module-spec.md](orders/orders-module-spec.md) |
| Immagini LELLO | [products/indexer.md](products/indexer.md) — §Sincronizzazione immagini LELLO |
