# Modello Dati — `product_marketplaces`

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-04

---

## Tabella `product_marketplaces`

| Colonna | Tipo | Vincoli | Note |
|---|---|---|---|
| `id` | BIGINT | PK, sequence (stessa configurazione di `products`) | |
| `product_id` | BIGINT | NOT NULL, FK → products.id ON DELETE CASCADE | |
| `marketplace_id` | BIGINT | NOT NULL, FK → marketplaces.id ON DELETE RESTRICT | |
| `enabled` | BOOLEAN | NOT NULL, default `false` | Disabilitato alla creazione — il [Publication Engine](publication-engine.md) decide quando abilitare |
| `calculated_price` | DECIMAL(10,5) | nullable, ≥ 0 | Prezzo calcolato dal [Price Rule Engine](price-engine.md) |
| `price_override` | DECIMAL(10,5) | nullable, ≥ 0 | Prezzo inserito manualmente |
| `price_overridden` | BOOLEAN | NOT NULL, default `false` | Se `true`: la sync usa `price_override` invece di `calculated_price` |
| `multiplier` | DECIMAL(10,5) | NOT NULL, default 1.0, > 0 | Moltiplicatore sul prezzo finale |
| `last_synced_at` | TIMESTAMP | nullable | Timestamp dell'ultima sync riuscita |
| `sync_status` | VARCHAR(20) | nullable | `SUCCESS` \| `ERROR` — null = mai sincronizzato |
| `sync_error_message` | TEXT | nullable | Messaggio sintetico dell'ultimo errore |
| `external_id` | VARCHAR(255) | nullable | ID esterno del prodotto sul marketplace (es. ASIN per Amazon) |
| `retry_count` | INT | NOT NULL, default 0, ≥ 0 | Tentativi di sync falliti consecutivi — azzerato al primo SUCCESS |
| `image_hash` | VARCHAR(8) | nullable | Hash (8 chars) del contenuto immagine — evita re-upload non necessari |
| `properties` | JSONB | nullable | Dati aggiuntivi specifici per marketplace |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | Aggiornato da trigger |

**Vincoli:**
- `UNIQUE(product_id, marketplace_id)` — al massimo una entry per coppia prodotto × marketplace
- `CHECK(sync_status IN ('SUCCESS', 'ERROR') OR sync_status IS NULL)`
- `CHECK(calculated_price >= 0)`
- `CHECK(price_override >= 0)`
- `CHECK(multiplier > 0)`
- `CHECK(price_overridden = FALSE OR price_override IS NOT NULL)`
- INDEX su `(marketplace_id, external_id)` — ricerca per ID esterno per marketplace

---

## Enum `SyncStatus`

```java
public enum SyncStatus {
    SUCCESS,   // ultima sync completata senza errori
    ERROR      // ultima sync fallita — dettaglio in sync_error_message
}
```

`null` nel DB equivale a "mai sincronizzato": il prodotto è in attesa della prima run.

---

## Entity `ProductMarketplace` — metodi transient

### `getFinalPrice(): BigDecimal`

```
se price_overridden = true E price_override != null:
    prezzo_base = price_override
altrimenti:
    prezzo_base = calculated_price

se prezzo_base = null:
    return null

return prezzo_base × multiplier
```

> Nessun arrotondamento qui. La precisione è 5 decimali.
> L'arrotondamento al formato richiesto dal canale (es. 2 decimali) è responsabilità
> dell'adapter del singolo marketplace.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Scrivere `sync_status` o `sync_error_message` fuori da `MarketplaceService` | Restituire esiti in `SyncBatchResultDTO.skuErrors` | `MarketplaceService` è l'unico owner dello stato di sync — scrivere altrove crea race condition e stato incoerente |
| Usare `price_override` senza impostare `price_overridden = true` | Impostare sempre entrambi insieme | `getFinalPrice()` controlla il flag booleano, non la nullità di `price_override` |
| Creare entry `ProductMarketplace` fuori dal `PublicationEngine` | Usare sempre `createInitialEntry()` | I valori iniziali (`enabled`, `multiplier`, `sync_status`) devono stare in un unico factory method |
| Arrotondare il prezzo dentro `getFinalPrice()` | Restituire a precisione piena (5 decimali) | L'arrotondamento è responsabilità dell'adapter marketplace, che conosce il formato richiesto dal canale |
| Assumere che `calculated_price` sia sempre non-null | Controllare esplicitamente prima di usarlo | `null` è uno stato valido: il prodotto è pubblicato ma in attesa del primo calcolo prezzo |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta | Logging |
|---|---|---|---|
| Violazione UNIQUE `(product_id, marketplace_id)` | `DataIntegrityViolationException` | Entry già esistente — skip (INSERT ON CONFLICT DO NOTHING) | — |
| `calculated_price` negativo | CHECK constraint `calculated_price >= 0` | Eccezione al persist — il chiamante deve validare prima di scrivere | ERROR |
| `multiplier` ≤ 0 | CHECK constraint `multiplier > 0` | Eccezione al persist — il chiamante deve validare prima di scrivere | ERROR |
| `price_overridden = true` con `price_override = null` | CHECK constraint | Eccezione al persist — vedi anti-pattern sopra | ERROR |
| `sync_status` non in (`SUCCESS`, `ERROR`, null) | CHECK constraint | Eccezione al persist | ERROR |
| `getFinalPrice()` con `calculated_price = null` e `price_overridden = false` | Logica interna | Ritorna `null` — il [Sync Engine](sync-engine.md) esclude il prodotto dalla sync | — |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Overview modulo | [marketplace.md](marketplace.md) |
| Logica di abilitazione alla creazione | [publication-engine.md](publication-engine.md) |
| Calcolo `calculated_price` | [price-engine.md](price-engine.md) |
| Aggiornamento `sync_status` | [sync-engine.md](sync-engine.md) |
