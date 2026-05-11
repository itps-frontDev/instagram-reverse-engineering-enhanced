# Sync Engine

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-04

---

## Scopo

Il Sync Engine seleziona i prodotti da aggiornare per ogni marketplace e delega l'invio verso il canale esterno alla strategy specifica. Aggiorna lo stato di sync sul DB al termine di ogni run.

---

## Pattern

Implementa il pattern **Strategy** ([refactoring.guru/design-patterns/strategy](https://refactoring.guru/design-patterns/strategy)):

- **Context:** `MarketplaceService` — orchestra la sync per ogni marketplace
- **Strategy interface:** `MarketplaceSyncStrategy` — contratto per ogni integrazione
- **Concrete strategies:** una per marketplace (es. `BricoSyncStrategy`, `AmazonSyncStrategy`)

```
MarketplaceService
│
├── Map<MarketplaceCode, MarketplaceSyncStrategy>   ← costruita via @PostConstruct da List<MarketplaceSyncStrategy>
│
└── syncAll()
        │
        └── per ogni marketplace enabled → syncMarketplace(marketplace)
                │
                ├── selezione prodotti (repository query)
                ├── strategy.syncBatch(products)
                └── aggiornamento SyncStatus sul DB
```

**Ownership dello stato:** `MarketplaceService` è l'unico responsabile di scrivere `sync_status` e `sync_error_message` su `product_marketplaces`. Le strategy non scrivono mai direttamente sul DB.

---

## Interfaccia `MarketplaceSyncStrategy`

```java
public interface MarketplaceSyncStrategy {

    MarketplaceCode getMarketplaceCode();

    /**
     * Invia le variazioni verso il marketplace.
     * Non scrive mai direttamente su ProductMarketplace.
     * Gli errori per singolo prodotto vanno in SyncBatchResultDTO.skuErrors.
     */
    SyncBatchResultDTO syncBatch(List<ProductMarketplace> products);
}
```

---

## `SyncBatchResultDTO`

| Campo | Tipo | Descrizione |
|---|---|---|
| `total` | int | Prodotti elaborati nel batch |
| `success` | int | Sync riuscite |
| `errors` | int | Sync fallite |
| `skuErrors` | Map\<String, String\> | `{ sku → messaggio sintetico }` per ogni prodotto fallito |

---

## Validazione a startup

`MarketplaceService` verifica in `@PostConstruct` che per ogni marketplace con `enabled=true` esista una `MarketplaceSyncStrategy` registrata. Se mancante: eccezione che blocca l'avvio.

```java
@PostConstruct
void init() {
    strategies = strategyList.stream()
        .collect(Collectors.toMap(MarketplaceSyncStrategy::getMarketplaceCode, Function.identity()));

    marketplaceRepository.findAllByEnabledTrue().forEach(m -> {
        if (!strategies.containsKey(MarketplaceCode.fromCode(m.getCode())))
            throw new IllegalStateException("Nessuna MarketplaceSyncStrategy per: " + m.getCode());
    });
}
```

---

## `MarketplaceService` — flusso `syncMarketplace`

```
1. Recupera strategy per marketplace.code
   Se non trovata → log WARN "{code}: nessuna strategy registrata", return

2. Seleziona prodotti da sincronizzare in chunk (default 1000, configurabile per marketplace):
   ProductMarketplaceRepository.findPendingSync(marketplace, pageable)
   → enabled=true
     AND (
         calculated_price IS NOT NULL
         OR (price_overridden = TRUE AND price_override IS NOT NULL)
     )                                        ← price guard: calcolato o override valorizzato
     AND (last_synced_at IS NULL
          OR product.updated_at > last_synced_at
          OR pm.updated_at      > last_synced_at)
     AND (sync_status != 'ERROR'
          OR pm.updated_at + backoff_interval(retry_count) <= NOW())
                                              ← backoff: prodotti in errore rispettano l'intervallo

3. Se primo chunk vuoto → return (nessuna operazione)

4. Per ogni chunk:
   a. result = strategy.syncBatch(chunk)
   b. Per ogni PM nel chunk:
      - SKU NON in skuErrors → sync_status=SUCCESS, last_synced_at=now(), sync_error_message=null, retry_count=0
      - SKU IN skuErrors     → sync_status=ERROR,   sync_error_message=skuErrors[sku], retry_count=retry_count+1
   c. Persisti bulk update
```

## `MarketplaceService` — flusso `syncAll`

Chiamato dallo scheduler. Itera su tutti i marketplace con `enabled=true` e chiama `syncMarketplace` per ciascuno.

Un errore su un marketplace (eccezione non gestita dalla strategy) viene catturato, loggato come ERROR, e non interrompe i marketplace successivi.

---

## Scheduling

```yaml
fatellisync:
  marketplace:
    sync:
      cron: "0 0 * * * *"   # ogni ora a minuto 0 — espressione Spring a 6 campi
```

**ShedLock — lock per marketplace:**

- Nome lock: `marketplace-sync-{marketplaceCode}` (es. `marketplace-sync-BRICOBRICO`)
- `lockAtMostFor`: leggermente superiore alla durata massima attesa del job per quel marketplace
- `lockAtLeastFor`: piccolo margine contro rilanci immediati da clock drift
- Lock persistito sulla stessa tabella `shedlock` del DB applicativo

---

## Backoff esponenziale (prodotti in `ERROR`)

| `retry_count` | Intervallo minimo prima del prossimo tentativo |
|---|---|
| 1 | 1 ora |
| 2 | 4 ore |
| 3 | 12 ore |
| ≥ 4 | 24 ore (massimo — retry giornaliero a oltranza) |

`pm.updated_at` (aggiornato dal trigger DB a ogni scrittura di `sync_status`) funge da timestamp dell'ultimo tentativo fallito.

Condizione in `findPendingSync`:
```
sync_status != 'ERROR' OR pm.updated_at + backoff_interval(retry_count) <= NOW()
```

`retry_count` viene azzerato a `0` al primo SUCCESS.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Scrivere `sync_status` o `sync_error_message` dentro `syncBatch` | Restituire gli esiti in `skuErrors` | `MarketplaceService` è l'unico owner dello stato DB |
| Calcolare o modificare il prezzo dentro `syncBatch` | Leggere `getFinalPrice()` su `ProductMarketplace` | Il prezzo è già calcolato e persistito dal Price Rule Engine |
| Lanciare eccezioni non gestite per singolo prodotto | Catturarle, aggiungere a `skuErrors`, continuare | Un errore su un prodotto non deve bloccare l'intero batch |
| Lanciare eccezioni non gestite a livello di marketplace | Propagarle al `syncAll` con try-catch per marketplace | Un marketplace rotto non deve bloccare gli altri |

---

## Error Handling

| Caso | Risposta | Logging |
|---|---|---|
| Nessuna strategy per il marketplace | Skip, nessuna eccezione | WARN con marketplaceCode |
| Errore su singolo prodotto nel batch | Inserito in `skuErrors`, batch continua | ERROR con sku + messaggio |
| Eccezione irrecuperabile a livello batch (es. API down) | Tutti i PM rimangono con status precedente, sync altri marketplace continua | ERROR con marketplaceCode + stacktrace |
| Lock ShedLock già acquisito | Run non parte (comportamento normale) | — |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Modello `product_marketplaces` | [product-marketplaces.md](product-marketplaces.md) |
| `getFinalPrice()` | [product-marketplaces.md](product-marketplaces.md) — §getFinalPrice |
| Price Rule Engine | [price-engine.md](price-engine.md) |
| Overview modulo | [marketplace.md](marketplace.md) |
