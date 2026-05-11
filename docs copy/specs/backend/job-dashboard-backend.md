# Job Dashboard — Backend

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-11

---

## Scopo

Estende il sistema esistente con quattro modifiche: costante `KnownJob` con i job noti, aggiunta di `latestRunByJobName` al tracker, strumentazione dei job schedulati, e nuovo endpoint `GET /api/priv/admin/jobs` che restituisce sempre tutti i job noti (IDLE per quelli mai eseguiti).

---

## Costante `KnownJob`

Enum `KnownJob` in `JobStatusController` che elenca tutti i job nome noti al dashboard. È la **source of truth** per quali job appaiono sempre nella risposta di `GET /api/priv/admin/jobs`.

| Job name | Trigger endpoint |
|---|---|
| `indexing-all` | `POST /api/priv/admin/indexing` |
| `publications-refresh` | `POST /api/priv/admin/publications/refresh` |
| `publications-prices` | `POST /api/priv/admin/publications/prices` |
| `marketplace-sync` | `POST /api/priv/admin/marketplace/sync` |
| `orders-sync` | `POST /api/priv/admin/orders/sync` |
| `images-sync` | `POST /api/priv/admin/images/sync` |

> **Job esclusi:** `indexing-{dataSource}` (TAXI, LELLO, CARMECCANICA, C_AND_C) non sono in `KnownJob` e non appaiono nel dashboard. Solo `indexing-all` è listato. I run per singolo datasource rimangono accessibili via `GET /api/priv/admin/jobs/{runId}` se si conosce il `runId` restituito dal trigger, ma non compaiono nella lista.

> **Regola di estensione:** ogni volta che viene aggiunto un nuovo job (nuovo endpoint trigger + nuova riga in [job-progress.md#fasi-per-job](job-progress.md#fasi-per-job)), il job name corrispondente va aggiunto a `KnownJob`. Senza questa aggiunta il job non appare mai nel dashboard, nemmeno dopo essere stato eseguito.

---

## Estensione `JobProgressTracker`

### Nuovo campo

`ConcurrentHashMap<String, String> latestRunByJobName` — mappa `jobName → runId` dell'ultimo run avviato per quel job name. Scrittura esclusiva tramite `start()`; lettura tramite `getLatestByJobName()`.

### Aggiornamento `start(jobName, totalPhases)`

Comportamento invariato rispetto a [job-progress.md#componente-jobprogresstracker](job-progress.md#componente-jobprogresstracker), con un'unica aggiunta: dopo aver inserito il `JobProgress` nella map `progress`, eseguire `latestRunByJobName.put(jobName, runId)`.

### Nuovo metodo `getLatestByJobName()`

```java
Map<String, JobProgress> getLatestByJobName()
```

| Comportamento | Dettaglio |
|---|---|
| Iterazione | Per ogni entry `(jobName, runId)` in `latestRunByJobName` |
| Risoluzione | `progress.get(runId)` — se `null` (run scaduto dal cleanup) → entry saltata silenziosamente |
| Ordinamento | Nessuno garantito (ConcurrentHashMap) |
| Risultato | `Map<String, JobProgress>` con al più una entry per job name |

> Il job non appare nella risposta se il suo ultimo run è scaduto dalla memoria. Il frontend lo mostra come IDLE.

---

## Strumentazione job schedulati

Ogni metodo schedulato deve chiamare `tracker.start()` dopo che ShedLock ha acquisito il lock, poi delegare alla stessa logica `doXxx(runId)` già usata dal trigger manuale corrispondente.

| Classe | Metodo schedulato | Metodo da riusare | Job name | Fasi |
|---|---|---|---|---|
| `IndexingScheduler` | `runAll()` | `doRunAll(runId)` | `indexing-all` | n. datasource abilitati |
| `MarketplaceService` | `syncAll()` | `doSyncAll(runId, marketplaces)` | `marketplace-sync` | n. marketplace abilitati |
| `OrderSyncService` | `syncAllScheduled()` | `doSyncAll(runId, marketplaces)` | `orders-sync` | n. marketplace abilitati |
| `PublicationRefreshJob` | `scheduledRefreshPublications()` | `doRefreshPublications(runId)` ¹ | `publications-refresh` | 1 |
| `PublicationRefreshJob` | `scheduledRefreshPrices()` | `doRefreshPrices(runId)` ¹ | `publications-prices` | 1 |
| `LelloImageSyncService` | `scheduledSync()` | `doSync(runId)` ¹ | `images-sync` | 1 |

> ¹ Refactor necessario: estrarre la logica esistente in un metodo `doXxx(runId)` che accetta e usa il `runId`.

> **`phases.total` per job multi-marketplace:** `MarketplaceService` e `OrderSyncService` devono interrogare il DB per il conteggio dei marketplace abilitati **prima** di chiamare `tracker.start(jobName, totalPhases)`. Se la query fallisce prima di `start()`, nessun run viene registrato e il job non parte.

**Posizione di `tracker.start()` — path schedulato:** `tracker.start()` è la prima istruzione del corpo del metodo annotato `@SchedulerLock`. Con AOP il metodo non viene invocato se il lock non è disponibile, quindi all'interno del corpo il lock è sempre già acquisito. Non esiste un hook "prima del lock" da cui chiamarlo.

**Posizione di `tracker.start()` — path trigger manuale:** `tracker.start()` va chiamato nel **controller**, prima di `executor.submit()`. Se venisse chiamato dentro la lambda, il client riceverebbe il `runId` nel `202` ma una chiamata immediata a `GET /jobs/{runId}` potrebbe tornare `404` perché il thread dell'executor non ha ancora registrato il run nel tracker.

Sequenza corretta per il manual path:
```
controller:
  Optional<SimpleLock> lock = lockService.tryLock(lockName);
  if (lock.isEmpty()) return 409;
  String runId = tracker.start(jobName, totalPhases);   ← QUI, nel controller
  SimpleLock acquired = lock.get();                     ← catturato PRIMA della lambda
  executor.submit(() -> {
      try { doXxx(runId); }   // doXxx chiama tracker.complete(runId, result) in caso di successo
      catch (Exception e) { tracker.fail(runId, e.getMessage()); }
      finally { acquired.unlock(); }                    ← SimpleLock.unlock()
  });
  return 202 { runId }
```

> `lockService.tryLock(lockName)` restituisce `Optional<SimpleLock>` (API di `IndexingLockService`). Il `SimpleLock` deve essere estratto in una variabile locale (`acquired`) prima della lambda — non si può usare `lock.get()` dentro la lambda perché `Optional` non è effectively-final in senso utile. `doXxx(runId)` chiama `tracker.complete(runId, result)` internamente al termine con successo; il `catch` gestisce i path di errore.

**Assunzione concorrenza — job con lock globale:** per `indexing`, `publications`, `images`, chiamate concorrenti a `start()` con lo stesso `jobName` sono prevenute da ShedLock — il secondo trigger ottiene `409` prima di raggiungere il tracker.

**`marketplace-sync` e `orders-sync` — nessun lock globale:** questi job non restituiscono mai `409`. Due trigger manuali concorrenti possono entrambi raggiungere `tracker.start()` con lo stesso `jobName`, sovrascrivendo l'entry in `latestRunByJobName`. Il dashboard mostrerà l'ultimo `runId` avviato; entrambi i run proseguono in background. Documentato come rischio accettato.

**Gestione errori:** il metodo schedulato wrappa `doXxx(runId)` in try/catch; se lancia eccezione chiama `tracker.fail(runId, e.getMessage())`.

---

## Endpoint `GET /api/priv/admin/jobs`

Controller: `JobStatusController` (esistente).

### Logica di costruzione risposta

Per ogni job name in `KnownJob` (ordine fisso dell'enum):
1. Cerca `JobProgress` via `tracker.getLatestByJobName().get(jobName)`
2. Se presente → include l'entry con i dati reali
3. Se assente (mai eseguito, o run scaduto) → include entry sintetica con `status = "IDLE"`

### Risposta

```json
{
  "jobs": [
    {
      "jobName": "indexing-all",
      "status": "IDLE",
      "runId": null,
      "phases": null,
      "overallPercent": 0,
      "startedAt": null,
      "completedAt": null,
      "result": null,
      "error": null
    },
    {
      "jobName": "publications-refresh",
      "status": "COMPLETED",
      "runId": "550e8400-...",
      "phases": { "total": 1, "completed": 1, "current": null },
      "overallPercent": 100,
      "startedAt": "2026-05-10T10:30:00Z",
      "completedAt": "2026-05-10T10:31:23Z",
      "result": { "created": 12, "updated": 45 },
      "error": null
    }
  ]
}
```

| Campo | Valore per entry reale | Valore per entry IDLE |
|---|---|---|
| `jobName` | Nome del job | Nome del job |
| `status` | Stato effettivo (`PENDING`/`RUNNING`/`COMPLETED`/`FAILED`) | `"IDLE"` |
| `runId` | UUID del run | `null` |
| `phases` | Oggetto fasi | `null` |
| `overallPercent` | 0–100 | `0` |
| `startedAt` / `completedAt` | Timestamp ISO 8601 | `null` |
| `result` / `error` | Valore o `null` | `null` |

> `IDLE` è uno status sintetico usato **solo** nel payload di questo endpoint. Non fa parte della state machine di `JobProgress` — vedi [job-progress.md#state-machine](job-progress.md#state-machine).

> **DTO risposta: `JobListEntry`** — la risposta non restituisce `JobProgress` direttamente ma un tipo distinto (record o classe) che ammette `"IDLE"` come valore di `status`. Campi: identici a `JobProgress` (`runId`, `jobName`, `status`, `phases`, `overallPercent`, `startedAt`, `completedAt`, `result`, `error`), con `status` dichiarato come `String` per supportare il valore sintetico non presente nell'enum `JobStatus`.

**Ordinamento:** fisso, determinato dall'ordine di `KnownJob`. Garantisce risposta stabile indipendentemente dall'ordine di esecuzione dei job.

**Nessuna paginazione:** esattamente `|KnownJob|` entry sempre; le dimensioni non crescono nel tempo.

**Stato PENDING:** tra `tracker.start()` e la prima `beginPhase()`, il job è in stato PENDING con `overallPercent = 0` e `phases.current = null`. Questa finestra può durare alcuni secondi per i job che devono fare operazioni di discovery prima di conoscere il totale (es. `images-sync` deve fare il listing FTP, `marketplace-sync` deve fare `COUNT(*)`). PENDING non indica un job bloccato — indica un job in fase di avvio. Il client deve mostrare uno spinner o "Avvio in corso..." per PENDING, non un errore.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Chiamare `tracker.start()` prima dell'acquisizione del lock | Chiamare dopo il lock | Run PENDING nel tracker senza esecuzione reale |
| Duplicare la logica tra metodo schedulato e trigger manuale | Estrarre in `doXxx(runId)` richiamato da entrambi | Divergenza inevitabile alla prossima modifica |
| Restituire `tracker.progress` intero in `GET /jobs` | Iterare su `KnownJob` + merge con `getLatestByJobName()` | La map interna contiene run storici multipli; la lista deve essere stabile e completa |
| Omettere `tracker.fail()` nel catch del job schedulato | `tracker.fail(runId, e.getMessage())` sempre nel catch | Il run resterebbe RUNNING in memoria per sempre |
| Scrivere direttamente su `latestRunByJobName` dall'esterno del tracker | Solo il metodo `start()` scrive su questa map | Garantisce consistenza con la map `progress` |
| Aggiungere un nuovo job senza aggiornare `KnownJob` | Aggiornare `KnownJob` contestualmente all'aggiunta del trigger endpoint | Il job non appare mai nel dashboard, nemmeno dopo l'esecuzione |

---

## Error Handling Matrix

| Caso | Risposta |
|---|---|
| `GET /api/priv/admin/jobs` — nessun run registrato | `{ "jobs": [...] }` con tutte le entry IDLE — `200 OK` |
| Run scaduto (1h) referenziato da `latestRunByJobName` | `getLatestByJobName()` restituisce assente → entry IDLE nella risposta |
| Eccezione nel job schedulato prima di `tracker.start()` | Run non registrato; dashboard mostra IDLE (ultimo stato noto invariato) |
| Eccezione nel job schedulato dopo `tracker.start()` | `tracker.fail(runId, error)` → status `FAILED` visibile in dashboard |
| Refactor `doXxx(runId)` — metodo non esiste ancora | Creare il metodo come refactoring dell'implementazione esistente prima di strumentare lo scheduler |

---

## Rischi accettati

| Rischio | Motivazione |
|---|---|
| Run scaduto appare IDLE invece di mostrare l'ultimo risultato | Scope differito; per MVP è accettabile — i run completano in minuti, non ore |
| Due trigger concorrenti di `marketplace-sync` / `orders-sync` sovrascrivono `latestRunByJobName` | Strumento admin single-user; la concorrenza è improbabile; entrambi i run proseguono correttamente in background |
| Run bloccati in stato `RUNNING` senza reaper | Se il job termina con eccezione non gestita senza chiamare `tracker.fail()`, il run resta `RUNNING` fino al restart JVM. Prevenuto dal pattern obbligatorio `try/catch → tracker.fail()` nello pseudo-code |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| `JobProgressTracker` API, data model, SSE, cleanup | [job-progress.md](job-progress.md) |
| Endpoint trigger esistenti, lock ShedLock | [admin-jobs-api.md](admin-jobs-api.md) |
| Lock ShedLock (`IndexingLockService`) | [products/indexer.md](products/indexer.md) |
