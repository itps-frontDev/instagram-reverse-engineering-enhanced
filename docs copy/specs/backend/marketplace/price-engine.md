# Price Rule Engine

**Tipo documento:** Implementation
**Versione:** 1.0
**Data:** 2026-05-04

---

## Scopo

Il Price Rule Engine calcola il prezzo di vendita per ogni coppia (prodotto, marketplace) in base alla sorgente dati del prodotto. Il prezzo calcolato viene salvato in `product_marketplaces.calculated_price` e usato dal [Sync Engine](sync-engine.md) durante la sincronizzazione.

---

## Pattern

Implementa il pattern **Strategy** ([refactoring.guru/design-patterns/strategy](https://refactoring.guru/design-patterns/strategy)):

- **Context:** `PriceService` — mantiene il registro delle strategie e delega il calcolo
- **Strategy interface:** `PriceCalculationStrategy` — contratto comune
- **Concrete strategies:** una per sorgente dati (es. `TaxiPriceCalculationStrategy`)

```
PriceService
│
├── Map<DataSource, PriceCalculationStrategy>   ← costruita via @PostConstruct da List<PriceCalculationStrategy>
│
└── calculatePrice(product, marketplace)
        │
        └── strategy.calculate(product, marketplace)
```

---

## Interfaccia `PriceCalculationStrategy`

```java
public interface PriceCalculationStrategy {

    DataSource getDataSource();

    /**
     * Calcola il prezzo lordo IVA inclusa per il prodotto sul marketplace indicato.
     * Restituisce null se il prezzo non è calcolabile.
     * Non applica il multiplier — responsabilità del chiamante.
     * Non solleva eccezioni controllate.
     */
    BigDecimal calculate(Product product, MarketplaceCode marketplace);
}
```

**Contratto:**
- Restituisce `null` se mancano i dati necessari (nessuna eccezione controllata).
- Non applica il `multiplier` di `ProductMarketplace` — lo applica chi chiama.
- In caso di dato malformato: logga WARN e restituisce `null`.

---

## `PriceService`

Riceve via iniezione la `List<PriceCalculationStrategy>` e in `@PostConstruct` costruisce la mappa `Map<DataSource, PriceCalculationStrategy>` chiamando `getDataSource()` su ciascuna. Se per un `DataSource` mancasse una strategy, `calculatePrice()` restituisce `null` con WARN (comportamento invariato).

```java
BigDecimal calculatePrice(Product product, MarketplaceCode marketplace)
```

**Flusso:**

```
1. Cerca strategy per product.dataSource nella mappa
2. Se non trovata → log WARN, return null
3. return strategy.calculate(product, marketplace)
```

Il `multiplier` non viene applicato qui: viene applicato da `getFinalPrice()` sull'entity al momento della sync.

---

## Strategie disponibili

| Sorgente | Classe | Spec |
|---|---|---|
| TAXI | `TaxiPriceCalculationStrategy` | [price-taxi.md](price-taxi.md) |
| LELLO | `LelloPriceCalculationStrategy` | [price-lello.md](price-lello.md) |
| CARMECCANICA | `CarMeccanicaPriceCalculationStrategy` | [price-carmeccanica.md](price-carmeccanica.md) |
| C&C | — | Fuori scope MVP |
| MANUAL | — | Fuori scope MVP |

`PriceService` restituisce `null` per le sorgenti senza strategy registrata.

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Calcolare il prezzo dentro `MarketplaceSyncStrategy` | Leggere `getFinalPrice()` su `ProductMarketplace` | Il prezzo è già calcolato e persistito; ricalcolarlo nella sync crea divergenza |
| Arrotondare il prezzo dentro `calculate()` o `calculatePrice()` | Restituire precisione piena (5 decimali) | L'arrotondamento è responsabilità dell'adapter del marketplace |
| Applicare il `multiplier` dentro la strategy | Lasciare che `getFinalPrice()` lo applichi | Il multiplier è un dato di `ProductMarketplace`, non della strategy |
| Lanciare eccezioni controllate da `calculate()` | Restituire `null` e loggare WARN | Il chiamante (`PriceService`) non deve gestire eccezioni per singolo prodotto — `null` segnala prezzo non calcolabile |
| Registrare più strategy per lo stesso `DataSource` | Una sola strategy per sorgente, risolvere conflitti prima del merge | `@PostConstruct` costruisce una mappa 1:1 `DataSource → Strategy` — duplicati causano eccezione a startup |

---

## Error Handling

| Caso | Risposta | Logging |
|---|---|---|
| Nessuna strategy per la sorgente | `calculatePrice()` restituisce `null` | WARN con dataSource |
| Listino non trovato nel prodotto | `calculate()` restituisce `null` | WARN con sku + marketplace |
| Prezzo = 0 nel listino | `calculate()` restituisce `null` | WARN con sku + listino |
| `properties` null o JSON malformato | `calculate()` restituisce `null` | ERROR con sku |

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Strategy TAXI | [price-taxi.md](price-taxi.md) |
| Strategy LELLO | [price-lello.md](price-lello.md) |
| Strategy CARMECCANICA | [price-carmeccanica.md](price-carmeccanica.md) |
| Campo `properties.listini` | [../products/indexer.md](../products/indexer.md) — §Listini prezzi |
| `calculated_price` nel modello | [product-marketplaces.md](product-marketplaces.md) |
| Applicazione `multiplier` | [product-marketplaces.md](product-marketplaces.md) — §getFinalPrice |
