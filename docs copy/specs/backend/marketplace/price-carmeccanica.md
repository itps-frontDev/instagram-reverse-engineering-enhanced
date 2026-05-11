# Price Strategy — CARMECCANICA

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-09

---

## Scopo

`CarMeccanicaPriceCalculationStrategy` implementa `PriceCalculationStrategy` per i prodotti indicizzati dalla sorgente CARMECCANICA. Calcola il prezzo di vendita applicando un ricarico fisso del 90% su `product.purchasing_price`.

`product.purchasing_price` per CARMECCANICA è pari a `prezzo_catalogo × 0.50`, come stabilito dalla strategia di indicizzazione `CarMeccanicaIndexingStrategy`.

---

## Mappatura marketplace → formula

Tutti i marketplace usano la stessa formula: ricarico del 90% sul prezzo di acquisto.

| Marketplace | Formula |
|---|---|
| `BRICOBRICO` | `purchasing_price × 1.90` |
| `AMAZON_IT` | `purchasing_price × 1.90` |
| `MANOMANO_IT` | `purchasing_price × 1.90` |
| `LEROY_MERLIN` | `purchasing_price × 1.90` |
| `BRICOBRAVO` | `purchasing_price × 1.90` |
| `FATELLI_CATERINA` | `purchasing_price × 1.90` |

Nessun arrotondamento: `calculate()` restituisce la precisione piena. L'arrotondamento finale è responsabilità dell'adapter marketplace, in linea con il contratto di `PriceCalculationStrategy`.

---

## Algoritmo `calculate(product, marketplace)`

```
1. Se product.purchasingPrice è null o ≤ 0 → log WARN "purchasing_price non valido per sku={sku}", return null

2. result = (purchasing_price × 1.90).setScale(2, CEILING)

3. return result
```

Il marketplace non influisce sul calcolo: il moltiplicatore è fisso a 1.90 per tutte le destinazioni.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Applicare moltiplicatori diversi per marketplace | Usare 1.90 per tutti | La regola aziendale è un ricarico uniforme del 90% — differenziare per canale richiederebbe decisione esplicita |
| Calcolare il prezzo come `prezzo_catalogo × 0.90` | Usare `purchasing_price × 1.90` | `purchasing_price` già sconta il 50% dal catalogo; applicare 0.90 sul catalogo darebbe un risultato diverso (× 0.90 vs × 0.95 effettivo) |
| Applicare `multiplier` o arrotondare dentro `calculate()` | Restituire il prezzo arrotondato a 2 decimali e lasciare il `multiplier` a `getFinalPrice()` | Doppio arrotondamento + multiplier causano deriva numerica |
| Lanciare eccezione se `purchasing_price` ≤ 0 | Restituire `null` + WARN | Il contratto di `PriceCalculationStrategy` vieta eccezioni |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta | Logging |
|---|---|---|---|
| `product.purchasingPrice` null | Controllo null | `return null` | WARN con SKU |
| `product.purchasingPrice` ≤ 0 | Controllo valore | `return null` | WARN con SKU |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Interfaccia `PriceCalculationStrategy` | [price-engine.md](price-engine.md) |
| Calcolo `purchasing_price` per CARMECCANICA (`prezzo_catalogo × 0.50`) | [../products/indexer.md](../products/indexer.md) — §Sorgente CARMECCANICA |
| Modello `Product` e campo `purchasingPrice` | [../products/indexer.md](../products/indexer.md) — §Modello Product |
