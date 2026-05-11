# Order Accounting — Implementation Spec

## 1. Obiettivo

Arricchire gli ordini sincronizzati con dati di contabilita' analitica. Spring crea la riga `order_accounting` (vuota) al sync di ogni nuovo ordine. Next.js arricchisce i campi di costo manualmente dalla UI.

Due risultati concreti:
1. **Dati di costo** — per ogni ordine: costo merce, commissione marketplace, costo spedizione reale, costi extra/reso, tracking, flag IVA per ogni voce.
2. **Profitto calcolato** — calcolato al volo in query/UI dalla formula documentata in sezione 7. Nessun campo derivato salvato nel DB.

**Implementation Implication:** La tabella `order_accounting` ha una relazione 1:1 con `orders`. Al sync di ogni nuovo ordine, Spring crea la riga con `purchase_cost` auto-calcolato e `marketplace_commission` se disponibile dall'API. Next.js gestisce tutti gli UPDATE successivi, compresi gli override dei campi auto-calcolati. Ottimistic lock via colonna `version` per prevenire sovrascritture concorrenti.

---

## 2. Decisioni architetturali

### ADR-OA-001: Tabella separata `order_accounting`

Tabella dedicata, non colonne aggiuntive su `orders`.

**Motivazione:** Separazione fisica tra dati di sync (marketplace → DB) e dati contabili (UI → DB). `OrderSyncService` crea la riga una sola volta (INSERT) con i campi auto-calcolati e non la modifica mai in seguito.

**Implementation Implication:** FK `order_accounting.order_id` con `UNIQUE` constraint (1:1). `ON DELETE CASCADE` — se un ordine viene rimosso (cleanup manuale), la riga accounting segue. La riga esiste sempre per ogni ordine (creata da Spring al sync).

### ADR-OA-002: Dual write — Spring crea e calcola, Next.js arricchisce

Spring crea la riga `order_accounting` al sync di ogni nuovo ordine e popola i campi calcolabili automaticamente. Next.js scrive i campi di costo operativo tramite Server Action.

**Partizione ownership per campo:**

| Campo | Owner write | Quando |
|-------|-------------|--------|
| `order_id` | Spring (JPA) | Al sync del nuovo ordine |
| `purchase_cost` | Spring (JPA) | Al sync: `SUM(product.cost × item.quantity)` per tutti gli order_items |
| `purchase_cost_vat_included` | Spring (JPA) | Costante derivata dalla convenzione `Product.cost` (vedere sezione 4.5) |
| `marketplace_commission` | Spring (JPA) | Al sync: da payload marketplace se disponibile, altrimenti `NULL` |
| `marketplace_commission_vat_included` | Spring (JPA) | Quando commission disponibile: dipende dalla convenzione del marketplace |
| `version`, `created_at`, `updated_at` | Spring (JPA) al INSERT; Next.js al UPDATE | — |
| `actual_shipping_cost`, `actual_shipping_cost_vat_included` | Next.js (Server Action) | UI manuale |
| `extra_cost`, `extra_cost_vat_included` | Next.js (Server Action) | UI manuale |
| `return_cost`, `return_cost_vat_included` | Next.js (Server Action) | UI manuale |
| `tracking_code` | Next.js (Server Action) | UI manuale |
| `properties` | Next.js (Server Action) | UI manuale |

**Implementation Implication:** Spring inietta `OrderAccountingRepository` e `ProductRepository` in `OrderSyncService`. Al sync di un nuovo ordine (`created++`), Spring crea la riga accounting con i campi auto-calcolati popolati e non la modifica mai piu'. Quando `updated++` o `skipped++`, Spring NON tocca `order_accounting`. Dopo la creazione, la riga appartiene esclusivamente a Next.js che gestisce tutti gli UPDATE, inclusi gli override di `purchase_cost` e `marketplace_commission`.

### ADR-OA-003: Flag `vat_included` per ogni campo costo

Ogni campo monetario di costo ha un campo BOOLEAN compagno `*_vat_included` per indicare se l'importo inserito include l'IVA.

**Motivazione:** I costi possono essere inseriti dall'utente al lordo (da fattura fornitore con IVA) o al netto (da estratto conto marketplace). Senza il flag, la formula profitto non e' confrontabile tra ordini.

**Implementation Implication:** Quando `vat_included = TRUE`, la formula divide l'importo per 1.22 (IVA 22% standard). Quando `vat_included = FALSE` o `NULL`, l'importo viene usato diretto (trattato come netto IVA). Vedere sezione 7 per la formula completa.

### ADR-OA-004: IVA ricavo — calcolo preciso per riga

Il ricavo netto IVA viene calcolato sommando `total_price_vat_inc / (1 + vat_rate/100)` per ogni `order_item` con `vat_rate` noto, piu' `shipping_cost / (1 + shipping_vat_rate/100)` se `shipping_vat_rate` e' noto.

**Motivazione:** `total_amount_vat_inc / 1.22` e' errato per ordini con prodotti a IVA 10% o 4% (categoria merceologica). I campi `order_items.vat_rate` e `orders.shipping_vat_rate` contengono gia' le aliquote.

**Implementation Implication:** La query profitto richiede un JOIN con `order_items`. Items con `vat_rate NULL` vengono sommati senza scorporo (trattati come IVA zero — caso edge, da loggare WARN).

### ADR-OA-005: Ottimistic lock via colonna `version`

Campo `version BIGINT NOT NULL DEFAULT 0` su `order_accounting`. Spring usa `@Version` (gestione automatica Hibernate). Next.js implementa il lock a livello SQL:

```sql
UPDATE order_accounting
SET campo = $valore, ..., version = version + 1, updated_at = NOW()
WHERE order_id = $orderId AND version = $versioneRicevutaDalClient
```

Se `0 righe aggiornate` → HTTP 409 "record modificato da un altro utente, ricarica la pagina".

**Implementation Implication:** La Server Action deve ricevere `version` nel payload e includerla nel WHERE. Il client deve memorizzare `version` quando carica i dati dell'ordine e inviarla al salvataggio.

### ADR-OA-006: JSONB `properties` per campi marketplace-specifici

I campi senza mapping universale vivono in `properties` con chiavi enumerate in sezione 6.2. Comportamento strict: payload con chiavi non in elenco → HTTP 400.

**Implementation Implication:** I valori monetari in JSONB sono stringhe decimali (es. `"12.34"`), non float JSON, per evitare imprecisione IEEE-754.

---

## 3. Schema DB (Liquibase)

File: `backend/src/main/resources/db-changelogs/changelogs/changelog-order-accounting.xml`
Aggiungere include in: `backend/src/main/resources/db-changelogs/changelog-master.xml`

### 3.1 Tabella `order_accounting`

| Colonna | Tipo | Nullable | Default | Vincoli |
|---------|------|----------|---------|---------|
| `id` | BIGINT | NO | sequence `order_accounting_id_seq` | PK |
| `order_id` | BIGINT | NO | — | FK -> `orders(id)` ON DELETE CASCADE, UNIQUE |
| `purchase_cost` | DECIMAL(10,2) | SI | — | — |
| `purchase_cost_vat_included` | BOOLEAN | SI | — | NULL = trattato come netto |
| `marketplace_commission` | DECIMAL(10,2) | SI | — | — |
| `marketplace_commission_vat_included` | BOOLEAN | SI | — | NULL = trattato come netto |
| `actual_shipping_cost` | DECIMAL(10,2) | SI | — | Costo pagato al corriere (≠ `orders.shipping_cost` = addebitato al cliente) |
| `actual_shipping_cost_vat_included` | BOOLEAN | SI | — | NULL = trattato come netto |
| `extra_cost` | DECIMAL(10,2) | SI | — | — |
| `extra_cost_vat_included` | BOOLEAN | SI | — | NULL = trattato come netto |
| `return_cost` | DECIMAL(10,2) | SI | — | — |
| `return_cost_vat_included` | BOOLEAN | SI | — | NULL = trattato come netto |
| `tracking_code` | VARCHAR(100) | SI | — | Lettera di vettura / numero tracking |
| `properties` | JSONB | SI | — | Campi marketplace-specifici (vedere sezione 6.2) |
| `version` | BIGINT | NO | 0 | Ottimistic lock — incrementato a ogni UPDATE |
| `created_at` | TIMESTAMP | NO | `NOW()` | — |
| `updated_at` | TIMESTAMP | NO | `NOW()` | — |

**Nota:** nessun indice aggiuntivo oltre il constraint UNIQUE su `order_id`. PostgreSQL crea automaticamente un B-tree per ogni UNIQUE constraint.

### 3.2 Sequenza

| Nome | allocationSize | Motivazione |
|------|---------------|-------------|
| `order_accounting_id_seq` | 1 | Volume identico agli ordini (~50/giorno) |

---

## 4. Entita' JPA

### 4.1 Package

```
com.fatellicaterinasrl.fatellisync.orders
├── models/
│   ├── Order.java               (esistente)
│   ├── OrderItem.java           (esistente)
│   ├── OrderAccounting.java     (NUOVO)
│   └── enums/
│       └── OrderStatus.java     (esistente)
├── repositories/
│   ├── OrderRepository.java           (esistente)
│   ├── OrderItemRepository.java       (esistente)
│   └── OrderAccountingRepository.java (NUOVO)
```

### 4.2 OrderAccounting

| Campo Java | Colonna DB | Tipo Java | Annotazioni chiave |
|------------|-----------|-----------|-------------------|
| `id` | `id` | `Long` | `@Id @GeneratedValue(strategy = SEQUENCE, generator = "order_accounting_seq")` |
| `order` | `order_id` | `Order` | `@OneToOne(fetch = LAZY, optional = false)` + `@JoinColumn(unique = true)` |
| `purchaseCost` | `purchase_cost` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `purchaseCostVatIncluded` | `purchase_cost_vat_included` | `Boolean` | — |
| `marketplaceCommission` | `marketplace_commission` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `marketplaceCommissionVatIncluded` | `marketplace_commission_vat_included` | `Boolean` | — |
| `actualShippingCost` | `actual_shipping_cost` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `actualShippingCostVatIncluded` | `actual_shipping_cost_vat_included` | `Boolean` | — |
| `extraCost` | `extra_cost` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `extraCostVatIncluded` | `extra_cost_vat_included` | `Boolean` | — |
| `returnCost` | `return_cost` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `returnCostVatIncluded` | `return_cost_vat_included` | `Boolean` | — |
| `trackingCode` | `tracking_code` | `String` | `@Column(length = 100)` |
| `properties` | `properties` | `String` | `@JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb")` |
| `version` | `version` | `Long` | `@Version` |
| `createdAt` | `created_at` | `LocalDateTime` | `@CreatedDate` |
| `updatedAt` | `updated_at` | `LocalDateTime` | `@LastModifiedDate` |

Annotazioni di classe: `@Entity`, `@Table(name = "order_accounting")`, `@Getter`, `@Setter`, `@ToString(exclude = "order")`, `@EqualsAndHashCode(of = "id")`, `@NoArgsConstructor`, `@EntityListeners(AuditingEntityListener.class)`.

**Nota Lombok:** NON usare `@Data` su questa entity — genera `equals`/`hashCode` includendo la relazione lazy `order`, causando lazy-loading inatteso e potenziali cicli.

**Implementation Implication:** La relazione `Order -> OrderAccounting` NON e' mappata bidirezionalmente su `Order.java`. `Order` non ha un campo `accounting`. Navigare dall'ordine all'accounting avviene tramite `OrderAccountingRepository.findByOrderId()`. Questo evita di caricare dati contabili ogni volta che `Order` viene letto dal sync.

### 4.3 OrderAccountingRepository

```java
public interface OrderAccountingRepository extends JpaRepository<OrderAccounting, Long> {
    Optional<OrderAccounting> findByOrder(Order order);
    Optional<OrderAccounting> findByOrderId(Long orderId);
}
```

### 4.4 Integrazione in OrderSyncService

`OrderSyncService` inietta `OrderAccountingRepository` e `ProductRepository`. Nel metodo `upsertOrders()`, aggiungere dopo ogni `created++`:

```java
OrderAccounting accounting = new OrderAccounting();
accounting.setOrder(savedOrder);

// Auto-calcolo purchase_cost
BigDecimal purchaseCost = savedOrder.getItems().stream()
    .map(item -> {
        if (item.getSku() == null) return BigDecimal.ZERO;
        return productRepository.findBySku(item.getSku())
            .map(p -> p.getCost() != null
                ? p.getCost().multiply(BigDecimal.valueOf(item.getQuantity()))
                : BigDecimal.ZERO)
            .orElseGet(() -> {
                log.warn("OrderAccounting: SKU {} non trovato per ordine {}", item.getSku(), savedOrder.getExternalOrderId());
                return BigDecimal.ZERO;
            });
    })
    .reduce(BigDecimal.ZERO, BigDecimal::add);
accounting.setPurchaseCost(purchaseCost);
accounting.setPurchaseCostVatIncluded(false); // Product.cost e' sempre netto IVA (vedere sezione 4.5)

// Commissione marketplace (se fornita dalla strategy)
BigDecimal commission = strategy.extractCommission(savedOrder);
if (commission != null) {
    accounting.setMarketplaceCommission(commission);
    accounting.setMarketplaceCommissionVatIncluded(false); // estratti marketplace sono sempre netti IVA
}

orderAccountingRepository.save(accounting);
```

Gli altri rami (`updated++`, `skipped++`) NON interagiscono con `order_accounting`.

### 4.5 Convenzione Product.cost e commissione marketplace

**`Product.cost`** e' il costo d'acquisto netto IVA (prezzo pagato al fornitore, senza IVA). Quindi `purchase_cost_vat_included` e' sempre `false`. Se `Product.cost` e' `NULL` per un prodotto, quel prodotto contribuisce 0 al `purchase_cost` e viene loggato WARN.

**Commissione marketplace:** ogni `OrderSyncStrategy` concreta implementa il metodo di default:

```java
default BigDecimal extractCommission(Order order) {
    return null; // nessuna commissione disponibile dall'API — default
}
```

Le strategy che ricevono la commissione nel payload marketplace lo sovrascrivono. Se `NULL`, `marketplace_commission` resta `NULL` nella riga accounting come default — l'utente può inserirla manualmente dalla UI.

---

## 5. Write path Next.js

### 5.1 Contratto upsert

**Precondizione:** la riga `order_accounting` esiste sempre (creata da Spring al sync). La Server Action fa sempre UPDATE, mai INSERT.

**Tutti i campi sono editabili da Next.js.** Spring pre-popola `purchase_cost` e `marketplace_commission` come valori di default calcolati, ma l'utente può correggerli dalla UI se il valore reale differisce (es. promozioni fornitore, storni parziali, commissioni non trasmesse dall'API).

```
Input: orderId, version, {
  purchaseCost, purchaseCostVatIncluded,
  marketplaceCommission, marketplaceCommissionVatIncluded,
  actualShippingCost, actualShippingCostVatIncluded,
  extraCost, extraCostVatIncluded,
  returnCost, returnCostVatIncluded,
  trackingCode,
  properties
}

1. Valida chiavi di `properties` contro whitelist sezione 5.2 → 400 se chiave sconosciuta
2. Valida valori monetari (DECIMAL, non negativi) → 400 se non valido
3. UPDATE order_accounting
   SET <campi presenti nel payload, NULL se esplicitamente null>,
       version = version + 1,
       updated_at = NOW()
   WHERE order_id = $orderId AND version = $version
4. Se 0 righe aggiornate → HTTP 409 "record modificato da un altro utente, ricarica la pagina"
5. Se 1 riga aggiornata → return riga aggiornata (inclusa nuova version)
```

**Semantica NULL vs campo assente:**
| Caso | Significato | Comportamento |
|------|-------------|---------------|
| Campo assente dal payload JSON | Non modificare | Escludi dalla SET clause |
| Campo presente con valore `null` | Cancella il valore | `SET campo = NULL` |
| Campo presente con valore | Aggiorna | `SET campo = $valore` |

### 5.2 Schema JSONB `properties` — chiavi valide per marketplace

| Marketplace | Chiave | Tipo JSON | Descrizione |
|-------------|--------|-----------|-------------|
| ManoMano | `commissioni_ordine` | `string` (decimale, es. `"7.84"`) | Commissione fissa per ordine (separata dalla commissione su prodotto) |
| BricoBravo | `ticket` | `string` | Numero ticket assistenza legato all'ordine |
| Amazon | `net_shipping_cost` | `string` (decimale, es. `"14.53"`) | Costo spedizione al netto di IVA e commissione Amazon |

Chiavi non elencate → HTTP 400. I valori monetari sono stringhe decimali (non float JSON) per evitare imprecisione IEEE-754.

---

## 6. Formula profitto

Calcolata al volo in query SQL o nel layer applicativo Next.js. Non salvata nel DB.

### 6.1 Ricavo netto IVA (calcolo preciso per riga)

```sql
-- Ricavo da prodotti: scorpora IVA per riga, fallback a 0% se vat_rate NULL
revenue_items =
  SUM(
    CASE
      WHEN oi.vat_rate IS NOT NULL THEN oi.total_price_vat_inc / (1.0 + oi.vat_rate / 100.0)
      ELSE oi.total_price_vat_inc  -- IVA ignota, trattata come 0%
    END
  )
  FROM order_items oi WHERE oi.order_id = o.id

-- Ricavo da spedizione
revenue_shipping =
  CASE
    WHEN o.shipping_vat_rate IS NOT NULL THEN o.shipping_cost / (1.0 + o.shipping_vat_rate / 100.0)
    ELSE COALESCE(o.shipping_cost, 0)  -- IVA ignota, trattata come 0%
  END

revenue_net_vat = COALESCE(revenue_items, 0) + COALESCE(revenue_shipping, 0)
```

**Note:** items con `vat_rate NULL` e spedizioni con `shipping_vat_rate NULL` vengono inclusi senza scorporo IVA (il profitto risultante e' sovrastimato per quell'ordine). La UI puo' segnalare gli ordini con dati IVA incompleti.

### 6.2 Costi netti IVA (con flag vat_included)

```sql
-- Funzione concettuale (espansa inline nella query)
cost_net(amount DECIMAL, vat_included BOOLEAN) =
  CASE
    WHEN amount IS NULL THEN 0
    WHEN vat_included = TRUE THEN amount / 1.22
    ELSE amount  -- vat_included FALSE o NULL: trattato come gia' netto
  END
```

### 6.3 Formula completa

```sql
profitto =
  revenue_net_vat
  - cost_net(oa.purchase_cost,            oa.purchase_cost_vat_included)
  - cost_net(oa.marketplace_commission,   oa.marketplace_commission_vat_included)
  - cost_net(oa.actual_shipping_cost,     oa.actual_shipping_cost_vat_included)
  - cost_net(oa.extra_cost,               oa.extra_cost_vat_included)
  - cost_net(oa.return_cost,              oa.return_cost_vat_included)

FROM orders o
JOIN order_accounting oa ON oa.order_id = o.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, oa.id
```

**Significato del flag `vat_included`:**
| Scenario | `vat_included` | Azione formula |
|----------|----------------|----------------|
| Utente inserisce importo da fattura fornitore (lordo IVA) | `TRUE` | Divide per 1.22 |
| Utente inserisce importo da estratto conto marketplace (netto IVA) | `FALSE` | Usa importo diretto |
| Utente non specifica | `NULL` | Usa importo diretto (trattato come netto — caso conservativo) |

---

## 7. Anti-Patterns (DO NOT)

| # | DON'T | DO Instead | Why |
|---|-------|------------|-----|
| 1 | Aggiungere colonne accounting direttamente in `orders` | Usare la tabella separata `order_accounting` | `OrderSyncService.applyUpdates()` potrebbe sovrascrivere campi contabili |
| 2 | Mappare `Order.accounting` come campo bidirezionale | Navigare via `OrderAccountingRepository.findByOrderId()` | Evita di caricare i dati contabili in ogni lettura del sync |
| 3 | Salvare il profitto come colonna | Calcolarlo con la formula in sezione 6.3 | Un campo derivato salvato diverge dagli input se un costo viene modificato |
| 4 | Usare `@Data` su `OrderAccounting` | `@Getter @Setter @ToString(exclude = "order") @EqualsAndHashCode(of = "id")` | `@Data` include la relazione lazy in `equals`/`hashCode`, causa lazy-loading e cicli |
| 5 | Salvare valori monetari in JSONB come float JSON | Usare stringhe decimali (`"12.34"`) | Float JSON ha imprecisione IEEE-754 per valori monetari |
| 6 | Ignorare silenziosamente chiavi JSONB sconosciute | Restituire HTTP 400 | Chiavi non gestite indicano un bug nel client o una modifica allo schema non coordinata |
| 7 | Calcolare il profitto in Java (Spring) | In query SQL o nel layer Next.js | Il dato non serve al backend; nessun sync lo usa |
| 8 | Spring fare UPDATE su `order_accounting` quando un ordine e' aggiornato | Spring fa solo INSERT (riga vuota) al sync di un nuovo ordine | Gli aggiornamenti dei campi di costo sono responsabilita' esclusiva di Next.js |
| 9 | Next.js fare UPDATE senza includere `version` nel WHERE | `WHERE order_id = $id AND version = $clientVersion` | Senza ottimistic lock, due salvataggi concorrenti si sovrascrivono silenziosamente |
| 10 | Payload Next.js con campo assente per "non modificare" e campo `null` per "cancellare" trattati allo stesso modo | Campo assente → escludi dalla SET clause; campo `null` esplicito → `SET campo = NULL` | Comportamento divergente, perdita dati silenziosa |
| 11 | Confondere `actual_shipping_cost` con `orders.shipping_cost` | Documentare esplicitamente: `shipping_cost` = addebitato al cliente (entrata); `actual_shipping_cost` = pagato al corriere (uscita) | Stesso nome concettuale, direzione finanziaria opposta |
| 12 | `cost_net(amount, vat_included)` con `NULL` di `vat_included` trattato come lordo IVA | `NULL` di `vat_included` = trattato come netto (conservativo) | Trattare come lordo sovrastima i costi → falso profitto positivo |
| 13 | Usare `1 / 1.22` in query SQL con tipi INTEGER | Cast esplicito: `amount / 1.22::DECIMAL` | Divisione intera in SQL tronca il risultato a zero |
| 14 | Spring aggiorna `order_accounting` quando un ordine esistente viene modificato (`updated++`) | Spring scrive `order_accounting` SOLO all'INSERT iniziale (nuovo ordine). Dopo la creazione, la riga appartiene a Next.js — Spring non la tocca mai piu' | L'override manuale dell'utente verrebbe perso al sync successivo |
| 15 | `purchase_cost = 0` silenzioso quando un SKU non ha `Product.cost` | Log WARN obbligatorio con SKU e `external_order_id` | Zero silenzioso distorce il profitto calcolato senza alcun segnale all'utente |

---

## 8. Error Handling Matrix

| Error Type | Detection | Response | Logging |
|------------|-----------|----------|---------|
| `order_id` non esistente nella Server Action | FK violation su INSERT (impossibile — Spring crea sempre la riga) / findByOrderId ritorna empty | HTTP 400 "ordine non trovato" | WARN con orderId |
| Valore monetario non valido (es. testo, negativo) | Validation layer Next.js prima del DB | HTTP 400 con dettaglio campo | — |
| Chiave JSONB non in whitelist (sezione 5.2) | Validation layer Next.js | HTTP 400 con lista chiavi non valide | — |
| Concurrent write (ottimistic lock) | `UPDATE ... WHERE version = $v` ritorna 0 righe | HTTP 409 "record modificato da un altro utente, ricarica la pagina" | WARN con orderId e version ricevuta |
| DB non raggiungibile | Connection error | HTTP 503 | ERROR |
| Spring: OrderAccountingRepository non disponibile al sync | Spring context exception all'avvio | Fail-fast all'avvio (non silenzioso) | ERROR + stop avvio |

---

## 9. References

| Topic | Location |
|-------|----------|
| Orders module spec (tabella `orders`, `order_items`, `OrderSyncService`) | [orders-module-spec.md](orders-module-spec.md) |
| `OrderSyncStrategy` interface (aggiungere metodo `extractCommission`) | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/sync/OrderSyncStrategy.java` |
| `Order` entity | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/models/Order.java` |
| `OrderSyncService` (da modificare per ADR-OA-002) | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/sync/OrderSyncService.java` |
| `Product` entity (deve avere campo `cost: BigDecimal`) | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/core/models/Product.java` |
| `ProductRepository` (deve avere `findBySku(String)`) | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/core/repositories/ProductRepository.java` |
| `Marketplace` entity | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/core/models/Marketplace.java` |
| Liquibase master changelog | `backend/src/main/resources/db-changelogs/changelog-master.xml` |
| Anti-patterns Order Sync | [orders-module-spec.md, sezione 10](orders-module-spec.md#10-anti-patterns-do-not) |
