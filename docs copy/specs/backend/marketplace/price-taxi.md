# Price Strategy — TAXI

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-04

---

## Scopo

`TaxiPriceCalculationStrategy` implementa `PriceCalculationStrategy` per i prodotti indicizzati dalla sorgente TAXI. Legge i listini prezzi dal campo `product.properties.listini` e seleziona il prezzo corretto per il marketplace richiesto.

---

## Mappatura marketplace → listino TAXI

| Marketplace | Listino | Note |
|---|---|---|
| `BRICOBRICO` | `BRICOBRICO` | Listino dedicato |
| `AMAZON_IT` | `AMAZON` | Listino dedicato |
| `MANOMANO_IT` | `BBLMMANO` | Listino condiviso canale B2C |
| `LEROY_MERLIN` | `BBLMMANO` | Listino condiviso canale B2C |
| `BRICOBRAVO` | `BBLMMANO` | Listino condiviso canale B2C |
| `FATELLI_CATERINA` | `INGROSSO` | Listino e-commerce interno |

---

## Algoritmo `calculate(product, marketplace)`

```
1. Leggi product.properties → deserializza listini (lista di { name, price, iva })
   Se properties null o parsing fallisce → log ERROR, return null

2. Determina listino target dalla mappatura sopra
   Se marketplace non mappato → log WARN, return null

3. Cerca entry con name = listino target (case-sensitive)
   Se non trovata → log WARN "listino {name} assente per sku {sku}", return null

4. Se entry.price = 0 → log DEBUG "prezzo zero per sku {sku} listino {name}", return null

5. return entry.price  (BigDecimal, 5 decimali — nessun arrotondamento)
```

---

## Struttura `properties.listini` attesa

```json
{
  "listini": [
    { "name": "DETTAGLIO",  "price": 12.50000, "iva": 22 },
    { "name": "INDUSTRIA",  "price": 11.20000, "iva": 22 },
    { "name": "INGROSSO",   "price": 10.00000, "iva": 22 },
    { "name": "RISERVATO",  "price":  9.50000, "iva": 22 },
    { "name": "AMAZON",     "price": 12.00000, "iva": 22 },
    { "name": "BBLMMANO",   "price": 11.80000, "iva": 22 },
    { "name": "BRICOBRICO", "price": 11.50000, "iva": 22 }
  ]
}
```

Il campo `iva` nel listino è disponibile ma non viene usato in `calculate()`: l'IVA applicabile è `product.vat_rate`.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Hardcodare prezzi o percentuali di sconto nella strategy | Leggere sempre da `properties.listini` | I listini cambiano a ogni run di indicizzazione TAXI — valori hardcoded divergono silenziosamente |
| Applicare il `multiplier` o arrotondare dentro `calculate()` | Restituire il prezzo grezzo a 5 decimali | Arrotondamento e multiplier sono responsabilità di `getFinalPrice()` e dell'adapter marketplace |
| Modificare `product.properties` dall'interno della strategy | Trattare `properties` come read-only | La strategy è un lettore, non un writer — scrivere causerebbe side-effect non previsti durante la sync |
| Assumere che tutti i listini esistano per ogni prodotto | Gestire l'assenza con `return null` + WARN | I listini dipendono dalla sorgente: un prodotto TAXI può avere solo un sottoinsieme |
| Usare il campo `iva` del listino per calcoli di prezzo | Usare `product.vat_rate` | Il campo `iva` nel listino è informativo; l'aliquota fiscale applicabile è sempre `product.vat_rate` |

---

## Error Handling Matrix

| Caso | Rilevamento | Risposta | Logging |
|---|---|---|---|
| `product.properties` è null | Controllo esplicito | `return null` | ERROR con SKU |
| JSON `properties` malformato (deserializzazione fallisce) | Exception da ObjectMapper | `return null` | ERROR con SKU e messaggio |
| Lista `listini` vuota o assente nel JSON | Controllo dopo deserializzazione | `return null` | WARN con SKU |
| Marketplace non presente nella mappatura | Lookup restituisce null | `return null` | WARN con SKU + marketplace |
| Listino target non trovato nella lista | Stream filter vuoto | `return null` | WARN `listino {name} assente per sku {sku}` |
| Prezzo nel listino = 0 | Controllo esplicito | `return null` | DEBUG `prezzo zero per sku {sku} listino {name}` |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Interfaccia `PriceCalculationStrategy` | [price-engine.md](price-engine.md) |
| Fonte dati `properties.listini` | [../products/indexer.md](../products/indexer.md) — §Listini prezzi |
| Sorgente TAXI | [../products/indexer.md](../products/indexer.md) — §Sorgente TAXI |
