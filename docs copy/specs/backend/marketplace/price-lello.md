# Price Strategy — LELLO

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-09

---

## Scopo

`LelloPriceCalculationStrategy` implementa `PriceCalculationStrategy` per i prodotti indicizzati dalla sorgente LELLO. Calcola il prezzo di vendita applicando un moltiplicatore fisso su `product.purchasing_price`, che rappresenta il prezzo di acquisto dal feed FTP (colonna 25 del file `Anagrafica_Articoli.txt`).

---

## Mappatura marketplace → formula

| Marketplace | Formula | Prezzo minimo |
|---|---|---|
| `BRICOBRICO` | `purchasing_price × 1.70` | — |
| `AMAZON_IT` | `purchasing_price × product.minQuantity × 2.00` | €2.00 |
| `MANOMANO_IT` | `purchasing_price × 1.85` | — |
| `LEROY_MERLIN` | `purchasing_price × 1.85` | — |
| `BRICOBRAVO` | `purchasing_price × 1.85` | — |
| `FATELLI_CATERINA` | non applicabile | — |

Nessun arrotondamento: `calculate()` restituisce la precisione piena. L'arrotondamento finale è responsabilità dell'adapter marketplace, in linea con il contratto di `PriceCalculationStrategy`.

`FATELLI_CATERINA` non accetta prodotti LELLO: `calculate()` deve restituire `null` con log WARN se invocata per questo marketplace.

---

## Algoritmo `calculate(product, marketplace)`

```
1. Se marketplace = FATELLI_CATERINA → log WARN "LELLO non pubblicato su FATELLI_CATERINA, sku={sku}", return null

2. Se product.purchasingPrice è null o ≤ 0 → log WARN "purchasing_price non valido per sku={sku}", return null

3. Calcola prezzo base:
   - Se marketplace = AMAZON_IT:
       Se product.minQuantity ≤ 0 → log WARN "minQuantity non valido per sku={sku}", return null
       basePrice = purchasing_price × product.minQuantity × 2.00
   - Altrimenti:
       multiplier = getMappedMultiplier(marketplace)
       basePrice = purchasing_price × multiplier

4. Arrotonda: result = basePrice.setScale(2, CEILING)

5. Se marketplace = AMAZON_IT e result < 2.00 → result = 2.00

6. return result
```

---

## Algoritmo `getMappedMultiplier(marketplace)`

```
BRICOBRICO   → 1.70
MANOMANO_IT  → 1.85
LEROY_MERLIN → 1.85
BRICOBRAVO   → 1.85
```

Se marketplace non presente nella mappa → log WARN, return null.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Restituire un prezzo per `FATELLI_CATERINA` | Restituire `null` con WARN | LELLO non è mai pubblicato su FC; restituire un prezzo rischierebbe di avviare una sync non voluta |
| Usare `product.stepQuantity` al posto di `product.minQuantity` per Amazon | Usare `product.minQuantity` | `minQuantity` è la quantità minima di vendita, quella semanticamente corretta per il calcolo del prezzo per confezione |
| Lanciare eccezione se il marketplace non è mappato | Restituire `null` + WARN | Il contratto di `PriceCalculationStrategy` vieta eccezioni; `null` segnala prezzo non calcolabile |
| Applicare il prezzo minimo €2.00 a tutti i marketplace | Applicare solo per `AMAZON_IT` | Il vincolo di prezzo minimo è specifico di Amazon |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta | Logging |
|---|---|---|---|
| `marketplace = FATELLI_CATERINA` | Controllo esplicito | `return null` | WARN con SKU |
| `product.purchasingPrice` null | Controllo null | `return null` | WARN con SKU |
| `product.purchasingPrice` ≤ 0 | Controllo valore | `return null` | WARN con SKU |
| `marketplace` non presente nella mappa moltiplicatori | Lookup restituisce null | `return null` | WARN con SKU + marketplace |
| `product.minQuantity` ≤ 0 (richiesto per calcolo Amazon) | Controllo pre-uso | `return null` | WARN con SKU |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Interfaccia `PriceCalculationStrategy` | [price-engine.md](price-engine.md) |
| Sorgente LELLO e campo `purchasing_price` | [../products/indexer.md](../products/indexer.md) — §Sorgente LELLO |
| Modello `Product` e campi `minQuantity`, `quantityUnit` | [../products/indexer.md](../products/indexer.md) — §Modello Product |
