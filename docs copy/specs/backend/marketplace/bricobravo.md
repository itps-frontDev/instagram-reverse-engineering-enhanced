# BricoBravo — Integrazione

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-10

---

## Scopo

Descrive l'integrazione completa con BricoBravo: regole di eligibilità dei prodotti, formato del feed CSV e meccanismo di consegna.

BricoBravo non espone un'API REST: il canale di sincronizzazione è un **file CSV statico** che BricoBravo scarica periodicamente dall'URL esposto via nginx.

---

## Publication Strategy — `BricoBravoPublicationStrategy`

### Prodotti eligibili

| Criterio | Valore |
|---|---|
| DataSource | Solo `TAXI` |
| `product.isActive` | `true` |
| Quantity | Qualsiasi (inclusa 0 — la disponibilità è gestita dalla sync) |

La strategy implementa `PublicationStrategy` e restituisce lo stream da `ProductRepository.findAllActiveByDataSourceIds([DataSource.TAXI.id])`.

### Creazione entry

Per ogni prodotto eligibile senza entry esistente, `PublicationRefreshJob` crea una `ProductMarketplace` via `insertIfAbsent()` con i valori iniziali standard (vedi [publication-engine.md](publication-engine.md) — §createInitialEntry).

---

## Sync Strategy — `BricoBravoSyncStrategy`

### Approccio

Ad ogni chiamata di `syncBatch()`, la strategy **rigenera il feed completo** leggendo tutte le PM BricoBravo con `enabled=true`. Il file viene scritto atomicamente (write su `.tmp` + rename) per garantire che nginx non serva mai un file parziale.

Il feed completo viene riscritto anche se il batch contiene solo un prodotto modificato: questo assicura che il file sia sempre lo snapshot corrente del catalogo.

### Filtri di inclusione nel CSV

| Criterio | Comportamento se non soddisfatto |
|---|---|
| `product.ean` non blank | Prodotto escluso dal CSV |
| `product.stepQuantity ≤ 1` | Prodotto escluso (confezioni multiple non supportate) |
| `pm.getFinalPrice()` non null | Prodotto escluso (price guard) |

I prodotti esclusi vengono contati e loggati come INFO al termine della generazione. La lista di SKU esclusi gestita nel vecchio sistema è stata rimossa: l'esclusione si gestisce disabilitando il PM via frontend (`enabled=false`).

### Calcolo prezzo

```
sellingPrice = pm.getFinalPrice() + SHIPPING_COST
sellingPrice = sellingPrice.setScale(2, CEILING)
```

| Parametro | Valore |
|---|---|
| `SHIPPING_COST` | €12.00 (flat, tutti i prodotti) |
| Arrotondamento | CEILING 2 decimali |
| `discountedPrice` | Uguale a `sellingPrice` (nessuno sconto applicato) |
| IVA (`vat`) | 22 (sempre) |
| `processingTime` | 3 giorni (sempre) |

`getFinalPrice()` già include il `multiplier` da `ProductMarketplace`. Il prezzo viene arrotondato qui (non in `PriceCalculationStrategy`) perché la spedizione va sommata prima dell'arrotondamento.

---

## Formato feed CSV

Separatore: `;` — nessun carattere di quoting.

I campi testo vengono sanitizzati: `;` → `,`, newline rimosse, HTML pulito con Jsoup (safelist relaxed).

### Feed completo — `bricobravo_inventory.csv`

| # | Colonna | Fonte |
|---|---|---|
| 1 | `Sku EAN/GTIN` | `product.ean` |
| 2 | `Category` | `product.category.name()` (enum), default `GENERICO` |
| 3 | `Brand` | `product.brand`, default `MADE IN ITALY` |
| 4 | `ProductName` | `product.name` |
| 5 | `Url` | `.` (placeholder) |
| 6 | `Weight` | `product.weight` in kg, formato `0.00`, default `0.00` |
| 7 | `Product Description` | `product.description` (HTML pulito con Jsoup) |
| 8-17 | `Image URL 1-10` | Solo `Image URL 1` = `product.imageUrl`; gli altri vuoti |
| 18 | `Selling Price (Price to GPP)` | `getFinalPrice() + €12.00`, CEILING 2 dec |
| 19 | `Discounted Price` | Uguale a `Selling Price` |
| 20 | `Vat` | `22` |
| 21 | `Available Quantity` | `product.quantity` |
| 22 | `Processing Time` | `3` |
| 23 | `Product_Code` | `product.sku` |

### Feed minimale — `bricobravo_minimal_inventory.csv`

Usato da BricoBravo per aggiornamenti rapidi di prezzo e stock.

| # | Colonna | Fonte |
|---|---|---|
| 1 | `Sku EAN/GTIN` | `product.ean` |
| 2 | `Selling Price (Price to GPP)` | `getFinalPrice() + €12.00`, CEILING 2 dec |
| 3 | `Discounted Price` | Uguale a `Selling Price` |
| 4 | `Available Quantity` | `product.quantity` |
| 5 | `Processing Time` | `3` |
| 6 | `Product_Code` | `product.sku` |

---

## Consegna — nginx

I file vengono scritti da Spring su un **volume Docker condiviso** (`feeds`) e serviti da nginx come static files.

| Parametro | Valore |
|---|---|
| URL feed completo | `https://hub.fatellicaterinasrl.com/feeds/bricobravo_inventory.csv` |
| URL feed minimale | `https://hub.fatellicaterinasrl.com/feeds/bricobravo_minimal_inventory.csv` |
| Percorso prod (Spring) | `/data/feeds/` |
| Percorso dev (Spring) | `C:/tmp/feeds/` |
| nginx location | `/feeds/` → `alias /data/feeds/` (read-only) |
| Scrittura atomica | write su `.tmp` + `Files.move(ATOMIC_MOVE)` |

### Configurazione YAML

```yaml
fatellisync:
  bricobravo:
    feed:
      full-path: /data/feeds/bricobravo_inventory.csv
      minimal-path: /data/feeds/bricobravo_minimal_inventory.csv
```

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Scrivere direttamente sul file target | Scrivere su `.tmp` + rinominare atomicamente | nginx potrebbe servire un file parziale durante la scrittura |
| Applicare l'arrotondamento in `PriceCalculationStrategy` | Arrotondare in `BricoBravoSyncStrategy` dopo aver sommato la spedizione | La spedizione deve essere inclusa prima dell'arrotondamento finale |
| Hardcodare una lista di SKU da escludere | Disabilitare i PM via frontend | Le esclusioni cambiano nel tempo; gestirle via DB elimina i deploy per aggiornare la lista |
| Inviare solo i prodotti del batch corrente | Rigenerare sempre il feed completo | BricoBravo scarica un file snapshot — un feed parziale rimuoverebbe i prodotti non inclusi |
| Scrivere `sync_status` dentro `syncBatch` | Restituire `SyncBatchResultDTO` — lo scrive `MarketplaceService` | Contratto del Sync Engine: ownership dello stato DB è di `MarketplaceService` |

---

## Error Handling

| Caso | Risposta | Logging |
|---|---|---|
| Eccezione durante generazione CSV | Tutti i PM del batch → ERROR in `skuErrors` | ERROR con stacktrace |
| `product.ean` blank | Prodotto escluso dal CSV | — (contato nel totale skipped) |
| `stepQuantity > 1` | Prodotto escluso | — (contato nel totale skipped) |
| `getFinalPrice()` null | Prodotto escluso | — (contato nel totale skipped) |
| `product.weight` null o ≤ 0 | Weight → `0.00` | — |
| `product.description` blank | Description → testo di fallback standard | — |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Interfaccia `PublicationStrategy` | [publication-engine.md](publication-engine.md) |
| Interfaccia `MarketplaceSyncStrategy` | [sync-engine.md](sync-engine.md) |
| `getFinalPrice()` e `multiplier` | [product-marketplaces.md](product-marketplaces.md) — §getFinalPrice |
| Calcolo `calculated_price` per TAXI | [price-taxi.md](price-taxi.md) |
| Calcolo `calculated_price` per LELLO | [price-lello.md](price-lello.md) |
| Overview modulo | [marketplace.md](marketplace.md) |
