# Publication Engine

**Tipo documento:** Implementation
**Versione:** 2.0
**Data:** 2026-05-04

---

## Scopo

Il Publication Engine decide quali prodotti pubblicare su ogni marketplace e crea le entry `product_marketplaces` corrispondenti. Gira come **job batch schedulato**, non come listener di eventi.

---

## Principi

- Le regole di eligibilità (quali prodotti vanno su quale marketplace) sono incapsulate in una `PublicationStrategy` per marketplace.
- Il job crea entry **solo per i prodotti eligibili** e **solo se l'entry non esiste ancora**.
- Se un operatore disabilita manualmente una pubblicazione via FE (`enabled=false`), il job **non la riattiva mai** — l'entry esiste già, il job la salta.
- Una pubblicazione con `calculated_price=null` è trattata come disabilitata dal [Sync Engine](sync-engine.md): non vendiamo prodotti a €0.

---

## Pattern

Implementa il pattern **Strategy** ([refactoring.guru/design-patterns/strategy](https://refactoring.guru/design-patterns/strategy)):

- **Context:** `PublicationRefreshJob` — itera sui marketplace e delega la selezione dei prodotti
- **Strategy interface:** `PublicationStrategy` — contratto per le regole di eligibilità
- **Concrete strategies:** una per marketplace (definite nelle spec di integrazione per marketplace)

```
PublicationRefreshJob
│
├── Map<MarketplaceCode, PublicationStrategy>   ← costruita via @PostConstruct da List<PublicationStrategy>
│
└── per ogni marketplace enabled → refreshPublications(marketplace)
        │
        └── strategy.getEligibleProducts()
                │
                └── per ogni prodotto: crea PM se non esiste
```

---

## Interfaccia `PublicationStrategy`

```java
public interface PublicationStrategy {

    MarketplaceCode getMarketplaceCode();

    /**
     * Restituisce i prodotti eligibili per questo marketplace.
     * Lo stream deve essere chiudibile (usato in try-with-resources).
     */
    Stream<Product> getEligibleProducts();
}
```

Le regole di eligibilità per ogni marketplace sono specificate nelle rispettive spec di integrazione.

---

## Validazione a startup

`PublicationRefreshJob` verifica in `@PostConstruct` che per ogni marketplace con `enabled=true` esista una `PublicationStrategy` registrata. Se mancante: eccezione che blocca l'avvio.

```java
@PostConstruct
void init() {
    strategies = strategyList.stream()
        .collect(Collectors.toMap(PublicationStrategy::getMarketplaceCode, Function.identity()));

    marketplaceRepository.findAllByEnabledTrue().forEach(m -> {
        if (!strategies.containsKey(MarketplaceCode.fromCode(m.getCode())))
            throw new IllegalStateException("Nessuna PublicationStrategy per: " + m.getCode());
    });
}
```

---

## `PublicationRefreshJob` — flusso

```
1. Per ogni marketplace con enabled=false:
       count = disableAllByMarketplaceId(marketplace.id)
       Se count > 0 → log INFO "{marketplace}: {N} pubblicazioni disabilitate"

2. Per ogni marketplace con enabled=true:
    a. Recupera strategy per marketplace.code
       Se non trovata → log WARN, skip

    b. try-with-resources su strategy.getEligibleProducts():
       Per ogni Product nello stream:
           i. Cerca PM esistente per (product, marketplace)
           ii. Se NON esiste:
                   entry = createInitialEntry(product, marketplace)
                   persist(entry)   ← INSERT … ON CONFLICT (product_id, marketplace_id) DO NOTHING
           iii. Se ESISTE → skip (non modificare mai enabled)

    c. Log: "{marketplace}: {N} pubblicazioni create"
```

### Disabilitazione automatica (`disableAllByMarketplaceId`)

Quando `marketplace.enabled` viene impostato a `false`, alla prossima run del job tutte le `product_marketplaces` con `enabled=true` per quel marketplace vengono disabilitate via UPDATE bulk. La query è idempotente: se già disabilitate in una run precedente, zero righe vengono modificate.

L'operazione è deliberatamente separata dalla creazione: avviene **prima** del loop sugli enabled, garantendo che un marketplace riabilitato non veda pubblicazioni disabilitate e poi immediatamente ricreate nella stessa run.

Un errore su un singolo prodotto viene loggato come ERROR e non interrompe il marketplace.
Un errore irrecuperabile su un marketplace viene loggato come ERROR e non interrompe i marketplace successivi.

---

## `createInitialEntry(Product, Marketplace): ProductMarketplace`

Crea una nuova entry per un prodotto eligibile. Chiamato solo quando l'entry non esiste.

| Campo | Valore |
|---|---|
| `enabled` | `true` |
| `multiplier` | `1.0` |
| `sync_status` | `null` (mai sincronizzato) |
| `price_overridden` | `false` |
| `calculated_price` | `PriceService.calculatePrice(product, marketplace)` — può essere `null` |

Se `calculated_price` è `null`, l'entry viene creata comunque: il prodotto è pubblicato ma escluso dalla sync finché il prezzo non viene calcolato (vedi §Price Guard).

---

## Price Guard

Una pubblicazione con `calculated_price=null` non viene sincronizzata.

Il [Sync Engine](sync-engine.md) include `calculated_price IS NOT NULL` nella query di selezione (`findPendingSync`). Non è necessario impostare `enabled=false`: la mancanza del prezzo è sufficiente a escludere il prodotto dalla sync.

Il prezzo si popola al successivo run di `refreshPrices()` (vedi sotto), ad esempio quando la sorgente dati fornisce il listino mancante.

---

## `refreshPrices(): int`

Ricalcola `calculated_price` per tutti i PM con `enabled=true` e `price_overridden=false`. Paginato a batch di 500.

```
Pagina PM (500 per pagina, solo enabled + non-overridden)
Per ogni chunk:
    Per ogni PM:
        newPrice = PriceService.calculatePrice(product, marketplace)
        se newPrice IS DISTINCT FROM pm.calculated_price:
            pm.calculated_price = newPrice
    Bulk update (solo PM con prezzo effettivamente modificato)
return totale aggiornati
```

---

## Scheduling

```yaml
fatellisync:
  publication:
    refresh:
      cron: "0 30 * * * *"   # ogni ora a minuto 30 (sfalsato rispetto alla sync)
    price-refresh:
      cron: "0 15 * * * *"   # ogni ora a minuto 15 (prima della publication refresh)
```

**ShedLock:**
- `publication-refresh` — lock globale per il job di creazione pubblicazioni
- `publication-price-refresh` — lock globale per il ricalcolo prezzi

---

## Anti-pattern (DO NOT)

| ❌ Non fare | ✅ Fare invece | Perché |
|---|---|---|
| Modificare `enabled` su entry esistenti | Skipparle sempre | Un'entry esistente può essere stata disabilitata manualmente — il job non deve sovrascrivere decisioni operative |
| Impostare `enabled=false` quando `calculated_price=null` | Lasciare `enabled=true`, escludere dalla sync via price guard | L'assenza del prezzo è temporanea; disabilitare richiederebbe una riabilitazione manuale |
| Usare `@TransactionalEventListener` per creare pubblicazioni | Usare il job batch schedulato | Gli eventi sincroni in transazione rallentano l'indicizzazione; il batch è più prevedibile e controllabile |
| Creare entry `ProductMarketplace` al di fuori di `createInitialEntry` | Usare sempre il factory method | I valori iniziali devono stare in un unico posto |
| Usare `price_override` senza impostare `price_overridden=true` | Impostare sempre entrambi insieme | `getFinalPrice()` controlla il flag booleano, non la nullità del valore |

---

## Error Handling

| Caso | Risposta | Logging |
|---|---|---|
| Nessuna `PublicationStrategy` per il marketplace | Skip marketplace | WARN con marketplaceCode |
| `PriceService.calculatePrice()` restituisce `null` | Entry creata con `calculated_price=null` — esclusa dalla sync dal price guard | DEBUG con sku + marketplace |
| Eccezione su singolo prodotto in `refreshPublications` | Continua con il prodotto successivo | ERROR con sku |
| Eccezione irrecuperabile su un marketplace | Continua con il marketplace successivo | ERROR con marketplaceCode |
| Eccezione su singolo chunk in `refreshPrices` | Continua con il chunk successivo | ERROR con range ID |

---

## Strategie di pubblicazione registrate

| Marketplace | Classe | Prodotti eligibili |
|---|---|---|
| `BRICOBRAVO` | `BricoBravoPublicationStrategy` | Solo TAXI, `isActive=true` |

Le altre `PublicationStrategy` verranno aggiunte man mano che i marketplace vengono integrati. Per i marketplace senza strategy il job logga WARN e salta.

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Modello `product_marketplaces` | [product-marketplaces.md](product-marketplaces.md) |
| Price guard nella query di sync | [sync-engine.md](sync-engine.md) — §findPendingSync |
| `calculatePrice()` | [price-engine.md](price-engine.md) |
| BricoBravo — regole eligibilità e sync | [bricobravo.md](bricobravo.md) |
| Overview modulo | [marketplace.md](marketplace.md) |
