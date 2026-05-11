# Orders Module — Implementation Spec

## 1. Obiettivo

Centralizzare in un unico database PostgreSQL gli ordini provenienti da tutti i marketplace gestiti da FatelliSync (BricoBrico, ManoMano IT, Amazon IT, Leroy Merlin, BricoBravo, Fatelli Caterina).

Due risultati concreti:
1. **Vista unificata** — Next.js legge direttamente dal DB per mostrare tutti gli ordini in un'unica interfaccia.
2. **Calcolo disponibilita' (BucketService)** — quantita' disponibile per prodotto = stock fisico - quantita' impegnate da ordini attivi. Questo dato alimenta il sync prodotti verso i marketplace.

Volume atteso: ~50 ordini/giorno totali tra tutti i marketplace.

**Implementation Implication:** Spring NON espone API REST per gli ordini. Spring si occupa esclusivamente della sincronizzazione (pull da marketplace -> upsert nel DB). Next.js interroga il DB direttamente.

---

## 2. Decisioni architetturali

### ADR-001: Pattern Strategy per Order Sync

Interfaccia `OrderSyncStrategy` con una implementazione per marketplace. Un `OrderSyncService` orchestra il sync direttamente (nessun Context intermedio — con ~50 ordini/giorno totali e' indirezione inutile).

**Implementation Implication:** Allineato al pattern `MarketplaceSyncStrategy` / `MarketplaceService` gia' presente nel progetto. Stessa struttura, direzione opposta: il sync prodotti e' push (Spring -> marketplace), il sync ordini e' pull (marketplace -> Spring).

### ADR-002: Schema DB — due tabelle, nessun evento

| Tabella | Scopo |
|---------|-------|
| `orders` | Testata ordine: marketplace, cliente, billing, shipping, importi |
| `order_items` | Righe ordine: SKU, quantita', prezzo, riferimento prodotto |

Nessuna tabella `order_events`. Se in futuro servisse uno storico stati, si aggiungera' con un changelog separato.

**Implementation Implication:** Unique constraint su `(marketplace_id, external_order_id)` garantisce idempotenza nell'upsert. `external_order_id` e' NOT NULL — ogni ordine DEVE avere un identificativo esterno. La colonna JSONB `properties` in entrambe le tabelle e' disponibile per dati marketplace-specifici; il suo utilizzo e' opzionale e non ha uno schema fisso.

### ADR-003: BucketService come servizio core

Servizio dedicato che calcola le quantita' impegnate per SKU. Filtra ordini con status PENDING o CONFIRMED (ordini attivi, non ancora spediti/annullati).

Nessun limite temporale sulla query: ci si aspetta che gli ordini PENDING/CONFIRMED vengano correttamente transizionati a SHIPPED o CANCELLED dal sync quando il marketplace li aggiorna. Ordini "bloccati" in stato attivo sono un problema del marketplace, non del BucketService.

**Implementation Implication:** Le `MarketplaceSyncStrategy` esistenti (sync prodotti) useranno `BucketService.getAvailableQuantities(products)` per determinare la quantita' disponibile in batch (una sola query DB). Il servizio deve propagare errori di query (mai restituire 0 come fallback — rischierebbe overselling). Quando `committed > stock`, il servizio logga WARN e restituisce 0.

### ADR-004: Scheduling e lock

Sync ordini schedulato via cron con ShedLock per evitare esecuzioni concorrenti. Lock name: `orders-sync`. Configurabile via `fatellisync.orders.sync.cron`.

**Implementation Implication:** Il cron di default (`0 30 * * * *`, ogni ora al minuto 30) e' sfalsato rispetto al sync prodotti (`0 0 * * * *`) per evitare picchi di carico.

### ADR-005: Fetch e persist in due fasi separate

La chiamata API al marketplace (`fetchOrders`) avviene FUORI dalla transazione DB. L'upsert degli ordini avviene DENTRO una transazione. Questo evita di tenere una connessione DB occupata durante la latenza di rete.

**Implementation Implication:**
```
// Fase 1 — fuori transazione
List<Order> fetched = strategy.fetchOrders(since);

// Fase 2 — dentro @Transactional
upsertOrders(fetched, strategy);
```

### ADR-006: Merge items preservando gli ID

Quando un ordine viene aggiornato, gli `order_items` NON vengono cancellati e ricreati. Si fa un merge per `externalItemId`:
1. Match item esistenti per `externalItemId`
2. Aggiorna in-place gli item matchati
3. Rimuovi item non piu' presenti nel marketplace
4. Aggiungi nuovi item

Questo garantisce stabilita' degli `order_items.id` tra sync cycle.

**Implementation Implication:** `externalItemId` e' il campo chiave per il matching. Se un marketplace non fornisce un item ID esterno, l'interface fornisce un metodo default `generateItemId` che produce un ID canonico (vedi sezione 5). L'approccio clear+re-add del progetto di riferimento e' esplicitamente scartato.

---

## 3. Schema DB (Liquibase)

File: `backend/src/main/resources/db-changelogs/changelogs/changelog-orders.xml`
Aggiungere include in: `backend/src/main/resources/db-changelogs/changelog-master.xml`

### 3.1 Tabella `orders`

| Colonna | Tipo | Nullable | Default | Vincoli |
|---------|------|----------|---------|---------|
| `id` | BIGINT | NO | sequence `orders_id_seq` | PK |
| `marketplace_id` | BIGINT | NO | — | FK -> `marketplaces(id)` |
| `external_order_id` | VARCHAR(100) | NO | — | UK `(marketplace_id, external_order_id)` |
| `status` | VARCHAR(20) | NO | `'PENDING'` | — |
| `customer_email` | VARCHAR(200) | SI | — | — |
| `customer_phone` | VARCHAR(50) | SI | — | — |
| `billing_type` | VARCHAR(50) | SI | — | — |
| `billing_first_name` | VARCHAR(100) | SI | — | — |
| `billing_last_name` | VARCHAR(100) | SI | — | — |
| `vat_number` | VARCHAR(50) | SI | — | — |
| `pec` | VARCHAR(100) | SI | — | — |
| `sdi` | VARCHAR(20) | SI | — | — |
| `shipping_first_name` | VARCHAR(100) | SI | — | — |
| `shipping_last_name` | VARCHAR(100) | SI | — | — |
| `shipping_address` | VARCHAR(500) | SI | — | — |
| `shipping_city` | VARCHAR(100) | SI | — | — |
| `shipping_postal_code` | VARCHAR(20) | SI | — | — |
| `shipping_province` | VARCHAR(50) | SI | — | — |
| `shipping_country` | VARCHAR(50) | NO | `'IT'` | — |
| `subtotal` | DECIMAL(10,2) | SI | — | — |
| `shipping_cost` | DECIMAL(10,2) | SI | — | — |
| `shipping_vat_rate` | INTEGER | SI | — | — |
| `total_amount_vat_inc` | DECIMAL(10,2) | NO | — | — |
| `currency` | VARCHAR(3) | NO | `'EUR'` | — |
| `notes` | TEXT | SI | — | — |
| `properties` | JSONB | SI | — | — |
| `ordered_at` | TIMESTAMP | SI | — | — |
| `created_at` | TIMESTAMP | NO | `NOW()` | — |
| `updated_at` | TIMESTAMP | NO | `NOW()` | — |

### 3.2 Tabella `order_items`

| Colonna | Tipo | Nullable | Default | Vincoli |
|---------|------|----------|---------|---------|
| `id` | BIGINT | NO | sequence `order_items_id_seq` | PK |
| `order_id` | BIGINT | NO | — | FK -> `orders(id)` ON DELETE CASCADE |
| `sku` | VARCHAR(32) | SI | — | — |
| `product_name` | TEXT | NO | — | — |
| `unit_price` | DECIMAL(10,2) | NO | — | — |
| `quantity` | INTEGER | NO | — | — |
| `total_price_vat_inc` | DECIMAL(10,2) | SI | — | — |
| `vat_rate` | INTEGER | SI | — | — |
| `external_item_id` | VARCHAR(100) | SI | — | — |
| `properties` | JSONB | SI | — | — |
| `created_at` | TIMESTAMP | NO | `NOW()` | — |
| `updated_at` | TIMESTAMP | NO | `NOW()` | — |

### 3.3 Indici

| Nome | Tabella | Colonne | Motivazione |
|------|---------|---------|-------------|
| `idx_orders_marketplace_status` | `orders` | `(marketplace_id, status)` | Query per marketplace + filtro stato (BucketService, UI) |
| `idx_orders_ordered_at` | `orders` | `(ordered_at)` | Ordinamento cronologico in UI |
| `idx_order_items_sku` | `order_items` | `(sku)` | BucketService: SUM quantity GROUP BY sku |
| `idx_order_items_order_id` | `order_items` | `(order_id)` | FK lookup |

### 3.4 Sequenze

| Nome | allocationSize | Motivazione |
|------|---------------|-------------|
| `orders_id_seq` | 1 | ~50 ordini/giorno totali, no necessita' di pre-allocazione |
| `order_items_id_seq` | 1 | Volume proporzionale agli ordini |

---

## 4. Entita' JPA

### 4.1 Package structure

```
com.fatellicaterinasrl.fatellisync.orders
├── models/
│   ├── Order.java
│   ├── OrderItem.java
│   └── enums/
│       └── OrderStatus.java
├── repositories/
│   ├── OrderRepository.java
│   └── OrderItemRepository.java
├── sync/
│   ├── OrderSyncStrategy.java       (interface)
│   └── OrderSyncService.java        (orchestratore)
└── BucketService.java
```

**Implementation Implication:** Le implementazioni concrete delle strategy (es. `BricoBricoOrderSyncStrategy`) vivranno nel package del marketplace corrispondente, non nel package `orders`. Seguono lo stesso pattern delle `MarketplaceSyncStrategy` concrete. Il mapping dagli status del marketplace a `OrderStatus` e' responsabilita' di ciascuna strategy concreta.

### 4.2 Order

| Campo Java | Colonna DB | Tipo Java | Annotazioni chiave |
|------------|-----------|-----------|-------------------|
| `id` | `id` | `Long` | `@Id @GeneratedValue(strategy = SEQUENCE, generator = "order_seq")` |
| `marketplace` | `marketplace_id` | `Marketplace` | `@ManyToOne(fetch = EAGER, optional = false)` |
| `externalOrderId` | `external_order_id` | `String` | `@Column(nullable = false, length = 100)` |
| `status` | `status` | `OrderStatus` | `@Enumerated(STRING)`, default `PENDING` |
| `customerEmail` | `customer_email` | `String` | `@Column(length = 200)` |
| `customerPhone` | `customer_phone` | `String` | `@Column(length = 50)` |
| `billingType` | `billing_type` | `String` | `@Column(length = 50)` |
| `billingFirstName` | `billing_first_name` | `String` | `@Column(length = 100)` |
| `billingLastName` | `billing_last_name` | `String` | `@Column(length = 100)` |
| `vatNumber` | `vat_number` | `String` | `@Column(length = 50)` |
| `pec` | `pec` | `String` | `@Column(length = 100)` |
| `sdi` | `sdi` | `String` | `@Column(length = 20)` |
| `shippingFirstName` | `shipping_first_name` | `String` | `@Column(length = 100)` |
| `shippingLastName` | `shipping_last_name` | `String` | `@Column(length = 100)` |
| `shippingAddress` | `shipping_address` | `String` | `@Column(length = 500)` |
| `shippingCity` | `shipping_city` | `String` | `@Column(length = 100)` |
| `shippingPostalCode` | `shipping_postal_code` | `String` | `@Column(length = 20)` |
| `shippingProvince` | `shipping_province` | `String` | `@Column(length = 50)` |
| `shippingCountry` | `shipping_country` | `String` | `@Column(nullable = false, length = 50)`, default `"IT"` |
| `subtotal` | `subtotal` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `shippingCost` | `shipping_cost` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `shippingVatRate` | `shipping_vat_rate` | `Integer` | — |
| `totalAmountVatInc` | `total_amount_vat_inc` | `BigDecimal` | `@Column(nullable = false, precision = 10, scale = 2)` |
| `currency` | `currency` | `String` | `@Column(nullable = false, length = 3)`, default `"EUR"` |
| `notes` | `notes` | `String` | `@Column(columnDefinition = "TEXT")` |
| `properties` | `properties` | `String` | `@JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb")` |
| `orderedAt` | `ordered_at` | `LocalDateTime` | — |
| `items` | — | `List<OrderItem>` | `@OneToMany(mappedBy = "order", cascade = ALL, orphanRemoval = true)` |
| `createdAt` | `created_at` | `LocalDateTime` | `@CreatedDate` |
| `updatedAt` | `updated_at` | `LocalDateTime` | `@LastModifiedDate` |

Annotazioni di classe: `@Entity`, `@Table(name = "orders", uniqueConstraints = UK su marketplace_id + external_order_id)`, `@Data`, `@NoArgsConstructor`, `@EntityListeners(AuditingEntityListener.class)`, `@JsonInclude(NON_NULL)`.

### 4.3 OrderItem

| Campo Java | Colonna DB | Tipo Java | Annotazioni chiave |
|------------|-----------|-----------|-------------------|
| `id` | `id` | `Long` | `@Id @GeneratedValue(strategy = SEQUENCE)` |
| `order` | `order_id` | `Order` | `@ManyToOne(fetch = LAZY, optional = false)` |
| `sku` | `sku` | `String` | `@Column(length = 32)` |
| `productName` | `product_name` | `String` | `@Column(nullable = false, columnDefinition = "TEXT")` |
| `unitPrice` | `unit_price` | `BigDecimal` | `@Column(nullable = false, precision = 10, scale = 2)` |
| `quantity` | `quantity` | `Integer` | `@Column(nullable = false)` |
| `totalPriceVatInc` | `total_price_vat_inc` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `vatRate` | `vat_rate` | `Integer` | — |
| `externalItemId` | `external_item_id` | `String` | `@Column(length = 100)` |
| `properties` | `properties` | `String` | `@JdbcTypeCode(SqlTypes.JSON)` |
| `createdAt` | `created_at` | `LocalDateTime` | `@CreatedDate` |
| `updatedAt` | `updated_at` | `LocalDateTime` | `@LastModifiedDate` |

### 4.4 OrderStatus (enum)

```java
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    CANCELLED
}
```

Tutti e 4 gli stati servono perche' arrivano dai marketplace. Il BucketService filtra solo su `PENDING` e `CONFIRMED`. Il mapping dagli status marketplace-specifici a questi 4 valori e' responsabilita' di ciascuna `OrderSyncStrategy` concreta.

---

## 5. OrderSyncStrategy (interface)

```java
public interface OrderSyncStrategy {

    MarketplaceCode getMarketplaceCode();

    /**
     * @param since se non null, fetch solo ordini da questa data in poi.
     *              Se null, fetch tutti gli ordini disponibili.
     */
    List<Order> fetchOrders(@Nullable LocalDateTime since);

    /**
     * Genera un externalItemId canonico quando il marketplace non ne fornisce uno.
     * Algoritmo: externalOrderId + "-" + indice 0-based nella lista items.
     *
     * Questo metodo e' il SINGOLO punto di generazione ID — le strategy concrete
     * NON devono inventare algoritmi propri. Lo sovrascrivono SOLO se il marketplace
     * fornisce un ID nativo (in quel caso usano quello).
     */
    default String generateItemId(String externalOrderId, int itemIndex) {
        return externalOrderId + "-" + itemIndex;
    }

    default boolean hasChanged(Order existing, Order incoming) {
        // Confronta TUTTI i campi che applyUpdates copia.
        // Lista completa:
        //   status, totalAmountVatInc, subtotal, shippingCost, shippingVatRate, currency,
        //   customerEmail, customerPhone,
        //   billingType, billingFirstName, billingLastName, vatNumber, pec, sdi,
        //   shippingFirstName, shippingLastName, shippingAddress, shippingCity,
        //   shippingPostalCode, shippingProvince, shippingCountry,
        //   notes, properties, orderedAt
        // Ritorna true se almeno un campo differisce.
    }

    default void applyUpdates(Order existing, Order incoming) {
        // Copia tutti i campi elencati in hasChanged da incoming a existing.
        //
        // Merge items per externalItemId (NON clear+re-add):
        //   1. Costruisci mappa existingItems: externalItemId -> OrderItem
        //   2. Per ogni item in incoming.getItems():
        //      a. Se esiste in mappa -> aggiorna campi in-place, rimuovi dalla mappa
        //      b. Se non esiste -> aggiungi a existing.getItems() con item.setOrder(existing)
        //   3. Items rimasti nella mappa -> rimuovi da existing.getItems()
        //
        // Questo preserva order_items.id per items invariati/aggiornati.
    }
}
```

**Implementation Implication:** `hasChanged()` e `applyUpdates()` sono allineati — confrontano e copiano esattamente gli stessi campi. Le strategy concrete li sovrascrivono solo se il marketplace ha logica specifica.

Per `externalItemId`: l'interface definisce `generateItemId(externalOrderId, itemIndex)` come algoritmo canonico unico. Le strategy usano questo metodo quando il marketplace non fornisce un ID nativo. Se il marketplace fornisce un ID (es. WooCommerce ha `lineItem.id`), la strategy usa quello direttamente. Non e' ammesso inventare algoritmi custom nelle strategy — o usi l'ID nativo del marketplace, o usi `generateItemId`.

---

## 6. OrderSyncService (orchestratore)

### Responsabilita'

- Riceve tutte le `OrderSyncStrategy` via injection (`List<OrderSyncStrategy>`)
- Per ogni strategy: due fasi separate (ADR-005)

### Flusso per marketplace

```
// Fase 1 — FUORI transazione (nessuna connessione DB occupata)
List<Order> fetched = strategy.fetchOrders(since);

// Fase 2 — DENTRO @Transactional
SyncResult result = upsertOrders(fetched, strategy);
```

### Upsert logic (dentro transazione)

Per ogni ordine nella lista `fetched`:
1. Lookup `orderRepository.findByMarketplaceAndExternalOrderId(marketplace, externalOrderId)`
2. Se non trovato -> `save(incoming)` -> contatore `created++`
3. Se trovato e `strategy.hasChanged(existing, incoming)` -> `strategy.applyUpdates(existing, incoming)` + `save(existing)` -> contatore `updated++`
4. Se trovato e non cambiato -> contatore `skipped++`
5. Se eccezione sul singolo ordine -> log WARN con externalOrderId e causa, continua con il prossimo

### Calcolo del parametro `since`

Per il sync schedulato, il servizio calcola `since` in base a una finestra configurabile:

```yaml
fatellisync:
  orders:
    sync:
      cron: "0 30 * * * *"
      fetch-window-days: 7    # fetch ordini degli ultimi N giorni
```

- Sync schedulato: `since = LocalDateTime.now().minusDays(fetchWindowDays)`
- Sync manuale con `syncOrders(MarketplaceCode)`: `since = null` (fetch tutti)

**Implementation Implication:** La finestra di 7 giorni e' un default conservativo. Copre ordini che potrebbero aver cambiato stato nella settimana. Con ~50 ordini/giorno totali, 7 giorni = ~350 ordini da confrontare per run — volume trascurabile.

### Scheduling

- `@Scheduled(cron = "${fatellisync.orders.sync.cron:0 30 * * * *}")`
- ShedLock lock name: `orders-sync`
- Lock at most for: `PT2H` (come indexing)
- Lock at least for: `PT5S`

### Return type

```java
public record SyncResult(int created, int updated, int skipped) {}
```

### Metodo pubblico per sync manuale

```java
public SyncResult syncOrders(MarketplaceCode code)
```

Seleziona la strategy corrispondente e la esegue con `since = null` (tutti gli ordini). Chiamabile da codice interno. Nessun controller/endpoint esposto — non in scope.

---

## 7. BucketService

### Query core

```sql
SELECT oi.sku, SUM(oi.quantity)
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('PENDING', 'CONFIRMED')
  AND oi.sku IS NOT NULL
GROUP BY oi.sku
```

Il filtro `sku IS NOT NULL` protegge da line item senza SKU (servizi, sconti, spese extra che alcuni marketplace potrebbero inviare).

### Metodi pubblici

| Metodo | Signature | Comportamento |
|--------|-----------|--------------|
| `getCommittedQuantities` | `Map<String, Integer> getCommittedQuantities()` | Tutte le quantita' impegnate, raggruppate per SKU. Una singola query DB. |
| `getCommittedQuantity` | `int getCommittedQuantity(String sku)` | Singolo SKU, 0 se non presente. Chiama `getCommittedQuantities()` — adatto per lookup singoli, NON per batch. |
| `getAvailableQuantity` | `int getAvailableQuantity(Product product)` | `max(0, stock - committed)`. Se `committed > stock`, logga WARN con SKU, stock e committed prima di restituire 0 — segnale di possibile overselling. |
| `getAvailableQuantities` | `Map<String, Integer> getAvailableQuantities(List<Product> products)` | **Metodo batch per il sync prodotti.** Chiama `getCommittedQuantities()` UNA volta, poi calcola la disponibilita' per ogni prodotto dalla mappa. Stessa logica di `getAvailableQuantity` ma senza ripetere la query. |

### Pattern d'uso

| Scenario | Metodo da usare | Perche' |
|----------|----------------|---------|
| Sync prodotti verso marketplace (N prodotti) | `getAvailableQuantities(products)` | Una sola query DB per l'intero batch |
| Singolo lookup (UI, debug) | `getAvailableQuantity(product)` | Convenienza, una query per chiamata |

### Costante

```java
private static final List<OrderStatus> COMMITTED_STATUSES = List.of(
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED
);
```

### Stock mismatch detection

Quando `committed > stock` per un prodotto, il BucketService logga:

```
WARN  BucketService: stock mismatch per SKU={}: stock={}, committed={} — possibile overselling
```

Il metodo restituisce comunque 0 (non quantita' negative). Il log WARN permette di individuare e investigare situazioni di overselling senza bloccare il sync.

**Implementation Implication:** Nessun limite temporale sulla query. Gli ordini PENDING/CONFIRMED devono essere transizionati a SHIPPED/CANCELLED dal sync quando il marketplace li aggiorna. Se un ordine resta "bloccato" in stato attivo, e' un problema del marketplace o della strategy — il BucketService riflette correttamente la realta'. Le `MarketplaceSyncStrategy` (sync prodotti) DEVONO usare `getAvailableQuantities(products)` per il batch, mai `getAvailableQuantity` in loop.

---

## 8. Repository

### OrderRepository

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByMarketplaceAndExternalOrderId(Marketplace marketplace, String externalOrderId);
}
```

### OrderItemRepository

```java
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("SELECT oi.sku, SUM(oi.quantity) FROM OrderItem oi " +
           "WHERE oi.order.status IN :statuses " +
           "AND oi.sku IS NOT NULL " +
           "GROUP BY oi.sku")
    List<Object[]> sumQuantitiesBySkuAndStatuses(@Param("statuses") List<OrderStatus> statuses);
}
```

**Implementation Implication:** La query usa JPQL con join implicito su `oi.order.status`. Hibernate genera il JOIN automaticamente grazie alla relazione `@ManyToOne`.

---

## 9. Configurazione

Aggiungere in `application.yaml`:

```yaml
fatellisync:
  orders:
    sync:
      cron: "0 30 * * * *"
      fetch-window-days: 7
```

---

## 10. Anti-Patterns (DO NOT)

| # | DON'T | DO Instead | Why |
|---|-------|------------|-----|
| 1 | Creare API REST per ordini in Spring | Next.js legge direttamente dal DB | Spring gestisce solo integrazioni; duplicare le API crea divergenza |
| 2 | Calcolare disponibilita' inline nel sync prodotti | Usare `BucketService` | Single responsibility, riutilizzabile, testabile |
| 3 | Una transazione per tutti i marketplace | Una transazione per marketplace | Un fallimento non blocca gli altri |
| 4 | Salvare il prezzo unitario dal campo `price` float di WooCommerce | Derivare da `subtotal / quantity` con RoundingMode.HALF_UP | Il campo `price` e' un float impreciso, subtotal e' stringa esatta |
| 5 | Fetch EAGER su `OrderItem.order` | Fetch LAZY su `OrderItem.order` | Evita N+1; EAGER solo su `Order.marketplace` che serve sempre |
| 6 | Logica di mapping nel service | Logica di mapping nella strategy concreta | Ogni marketplace ha formati e campi diversi |
| 7 | `orphanRemoval = true` senza `cascade = ALL` | Sempre insieme | Hibernate richiede cascade per gestire orphanRemoval |
| 8 | BucketService restituisce 0 se la query fallisce | Propagare l'eccezione | Restituire 0 = overselling; meglio bloccare il sync |
| 9 | Hardcodare stati committed nel BucketService | Costante `COMMITTED_STATUSES` | Punto unico di modifica se servono altri stati |
| 10 | `allocationSize = 500` per le sequenze ordini | `allocationSize = 1` | ~50 ordini/giorno, pre-allocazione inutile e spreca ID |
| 11 | `hasChanged()` controlla un subset dei campi di `applyUpdates()` | Controllare TUTTI i campi che verranno copiati | Campi non monitorati causano disallineamento silenzioso |
| 12 | `applyUpdates` fa clear + re-add degli items | Merge per `externalItemId` (update in-place, add new, remove missing) | Clear + re-add cambia gli `order_items.id` ad ogni sync |
| 13 | `fetchOrders()` dentro `@Transactional` | Fetch fuori transazione, upsert dentro | L'API call tiene la connessione DB occupata per tutta la latenza di rete |
| 14 | BucketService senza filtro `sku IS NOT NULL` | Aggiungere `AND oi.sku IS NOT NULL` alla query | Items senza SKU verrebbero raggruppati sotto chiave null |
| 15 | Chiamare `getAvailableQuantity()` in loop nel sync prodotti | Usare `getAvailableQuantities(products)` batch | Il metodo singolo fa una query SUM per ogni chiamata — N prodotti = N query identiche |

---

## 11. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|------------|-----------|----------|----------|---------|
| Marketplace API timeout | Timeout exception dal client HTTP | Skip marketplace, riprova al prossimo run | Ordini restano nel marketplace (nota: alcune API hanno retention windows — se il sync resta down a lungo, ordini molto vecchi potrebbero non essere piu' recuperabili) | ERROR con marketplace code |
| Marketplace API non raggiungibile | Connection exception | Skip marketplace, continua con gli altri | Prossimo run riprova | ERROR con marketplace code |
| Singolo ordine non mappabile | Exception nel mapping della strategy | Skip ordine, continua con il prossimo | Log dell'externalOrderId fallito | WARN con externalOrderId e causa |
| Unique constraint violation | DataIntegrityViolationException | Skip — race condition, ordine gia' presente | Prossimo run lo aggiorna se cambiato | WARN |
| MarketplaceCode sconosciuto | IllegalArgumentException | Skip marketplace | Log + continua | WARN |
| BucketService query fallisce | DataAccessException | **Propagare** — non restituire 0 | Nessun fallback: bloccare sync e' meglio di overselling | ERROR |
| Strategy non registrata per marketplace | Nessuna strategy trovata | Skip con log | Marketplace abilitato ma senza strategy = warning all'avvio | WARN |

---

## 12. References

| Topic | Location |
|-------|----------|
| Marketplace entity | `backend/src/main/java/.../core/models/Marketplace.java` |
| MarketplaceCode enum | `backend/src/main/java/.../shared/enums/MarketplaceCode.java` |
| Product entity | `backend/src/main/java/.../core/models/Product.java` |
| MarketplaceSyncStrategy (pattern di riferimento) | `backend/src/main/java/.../core/marketplace/MarketplaceSyncStrategy.java` |
| MarketplaceService (orchestratore di riferimento) | `backend/src/main/java/.../core/marketplace/MarketplaceService.java` |
| ShedLock configuration | `backend/src/main/java/.../core/config/ShedLockConfiguration.java` |
| Liquibase master changelog | `backend/src/main/resources/db-changelogs/changelog-master.xml` |
| application.yaml | `backend/src/main/resources/application.yaml` |
