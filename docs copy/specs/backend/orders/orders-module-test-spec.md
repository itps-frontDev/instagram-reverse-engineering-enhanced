# Orders Module — Test Spec (Implementation)

## 1. Scope

Test per il modulo `orders` implementato in `docs/specs/orders-module-spec.md`.

Componenti coperti:

| Componente | Tipo test | Motivazione |
|------------|-----------|-------------|
| `OrderSyncStrategy` default methods (`generateItemId`, `hasChanged`, `applyUpdates`) | Unit (no Spring) | Pura logica Java, nessuna dipendenza da DB o contesto |
| `BucketService` | Integration (Testcontainers) | Richiede query SQL reale su PostgreSQL con JSONB e trigger |
| `OrderSyncService.upsertOrders` | Integration (Testcontainers) | Richiede transazione JPA reale e verifica stato DB |

Non in scope: `OrderSyncStrategy.fetchOrders` nelle implementazioni concrete — dipende da API marketplace esterne.

---

## 2. Dipendenze (build.gradle)

Aggiungere nel blocco `dependencies`:

```groovy
testImplementation 'org.springframework.boot:spring-boot-testcontainers'
testImplementation 'org.testcontainers:junit-jupiter'
testImplementation 'org.testcontainers:postgresql'
```

Le versioni sono gestite dalla BOM `spring-boot-dependencies:4.0.6` già presente — nessuna versione esplicita necessaria.

---

## 3. Configurazione test

### 3.1 application-test.yaml

File: `backend/src/test/resources/application-test.yaml`

```yaml
fatellisync:
  orders:
    sync:
      cron: "-"
  marketplace:
    sync:
      cron: "-"
  indexing:
    cron: "-"
  lello:
    images:
      sync-cron: "-"
  publication:
    refresh:
      cron: "-"
    price-refresh:
      cron: "-"
```

`"-"` disabilita i `@Scheduled` in Spring Framework 7.x (usato da Spring Boot 4.x). Evita che i job schedulati si attivino durante i test.

**Liquibase NON viene overriddato**: applica gli stessi changelog di produzione. Il DB di test deve avere lo stesso schema del DB di prod.

### 3.2 Base class per integration test

File: `backend/src/test/java/com/fatellicaterinasrl/fatellisync/orders/OrdersIntegrationTestBase.java`

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
@Transactional
public abstract class OrdersIntegrationTestBase {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");
}
```

| Annotazione | Effetto |
|-------------|---------|
| `webEnvironment = NONE` | Nessun server HTTP, contesto più leggero |
| `@ActiveProfiles("test")` | Carica `application-test.yaml`, disabilita i cron |
| `@Testcontainers` | Gestisce lifecycle del container Docker |
| `@ServiceConnection` | Spring Boot configura `spring.datasource.*` automaticamente dal container |
| `static` container | Avviato una sola volta per JVM run, condiviso tra test della stessa classe |
| `@Transactional` sulla classe | Rollback automatico dopo ogni `@Test` — nessuna pulizia manuale |

Liquibase esegue una sola volta all'avvio del contesto Spring.

### 3.3 Dati di base disponibili nei test

Liquibase (changelog-marketplaces.xml) inserisce 6 marketplace con ID fissi. I test accedono al marketplace BRICOBRICO via `marketplaceRepository.findById(1L).orElseThrow()` in `@BeforeEach`.

Non è necessario creare entità `Product` nel DB per i test di `BucketService`: il servizio usa solo `product.getSku()` e `product.getQuantity()`, costruibili in memoria.

### 3.4 Package structure dei test

```
backend/src/test/java/com/fatellicaterinasrl/fatellisync/
└── orders/
    ├── OrdersIntegrationTestBase.java
    ├── BucketServiceIntegrationTest.java
    └── sync/
        ├── OrderSyncStrategyTest.java
        └── OrderSyncServiceIntegrationTest.java
```

---

## 4. Test: OrderSyncStrategy default methods (unit, no Spring)

File: `orders/sync/OrderSyncStrategyTest.java`

Classe JUnit 5 plain, nessuna annotazione Spring. Usa una anonymous implementation dell'interfaccia — deve implementare solo `getMarketplaceCode()` e `fetchOrders()` (abstract); i default methods vengono ereditati.

### 4.1 generateItemId

| ID | Input | Expected |
|----|-------|----------|
| TC-01 | `("ORD-123", 0)` | `"ORD-123-0"` |
| TC-02 | `("ORD-123", 5)` | `"ORD-123-5"` |
| TC-03 | `("", 0)` | `"-0"` |

### 4.2 hasChanged

TC-04 — `false` quando tutti i campi sono uguali:
- Crea due `Order` identici con tutti i 24 campi valorizzati
- `hasChanged(existing, incoming)` deve restituire `false`

TC-05 — `true` parametrizzato per ogni campo:
- `@ParameterizedTest` con 24 casi, uno per ogni campo che `applyUpdates` copia
- Ogni caso: parti da due `Order` identici, modifica UN campo nell'incoming
- `hasChanged(existing, incoming)` deve restituire `true`
- Campi da coprire: `status`, `totalAmountVatInc`, `subtotal`, `shippingCost`, `shippingVatRate`, `currency`, `customerEmail`, `customerPhone`, `billingType`, `billingFirstName`, `billingLastName`, `vatNumber`, `pec`, `sdi`, `shippingFirstName`, `shippingLastName`, `shippingAddress`, `shippingCity`, `shippingPostalCode`, `shippingProvince`, `shippingCountry`, `notes`, `properties`, `orderedAt`

**Implementation implication:** Usare `@MethodSource` che restituisce `Stream<Arguments>` — ogni elemento è `(String fieldName, Consumer<Order> mutator)`. Il test applica il mutator all'incoming e verifica `hasChanged == true`.

### 4.3 applyUpdates — campi scalari

TC-06 — tutti i 24 campi copiati:
- Crea `existing` con valori A, `incoming` con valori B diversi per tutti i campi scalari
- Chiama `applyUpdates(existing, incoming)`
- Verifica che `existing` abbia i valori B per ogni campo

### 4.4 applyUpdates — merge items

Per questi test: crea `OrderItem` con `id` esplicito (via setter) per verificare che l'ID sia preservato.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-07 | Update in-place | existing ha 1 item (id=10, externalItemId="I-1", qty=2); incoming ha 1 item (externalItemId="I-1", qty=5) | existing.items ha 1 item con id=10 e qty=5 |
| TC-08 | Add new | existing ha 1 item (externalItemId="I-1"); incoming ha 2 items (externalItemId="I-1" e "I-2") | existing.items ha 2 items, ID del primo invariato |
| TC-09 | Remove missing | existing ha 2 items (externalItemId="I-1" e "I-2"); incoming ha 1 item (externalItemId="I-1") | existing.items ha 1 item (externalItemId="I-1") |
| TC-10 | Item senza externalItemId in existing non rimosso | existing ha 1 item con externalItemId=null; incoming vuoto | existing.items ha ancora 1 item (non rimovibile senza ID) |

**Implementation implication:** Per questi test non serve Spring né DB. Usa `new ArrayList<>()` direttamente per `existing.getItems()`. L'`order` (parent) può essere `null` per i test di merge puro.

---

## 5. Test: BucketService (integration)

File: `orders/BucketServiceIntegrationTest.java`

Estende `OrdersIntegrationTestBase`. Inietta `BucketService`, `OrderRepository`, `MarketplaceRepository`.

Il `Marketplace` viene recuperato in `@BeforeEach` via `marketplaceRepository.findById(1L)`.

Gli `Order` vengono salvati via `OrderRepository.save()`. Gli `OrderItem` vengono aggiunti agli `Order` prima del save (cascade ALL).

Il `Product` per `getAvailableQuantity` è costruito in memoria: `new Product()` con `sku` e `quantity` impostati via setter.

| ID | Scenario | Setup | Metodo | Expected |
|----|----------|-------|--------|----------|
| TC-11 | PENDING + CONFIRMED sommati | ordine PENDING (SKU="A", qty=3) + ordine CONFIRMED (SKU="A", qty=2) | `getCommittedQuantities()` | `{A: 5}` |
| TC-12 | SHIPPED escluso | ordine SHIPPED (SKU="A", qty=10) | `getCommittedQuantities()` | mappa senza chiave "A" |
| TC-13 | CANCELLED escluso | ordine CANCELLED (SKU="A", qty=10) | `getCommittedQuantities()` | mappa senza chiave "A" |
| TC-14 | SKU null ignorato | ordine PENDING con item SKU=null, qty=5 | `getCommittedQuantities()` | mappa vuota |
| TC-15 | Disponibile = stock - committed | PENDING qty=3; product.quantity=10 | `getAvailableQuantity(product)` | `7` |
| TC-16 | Stock mismatch → 0 | PENDING qty=5; product.quantity=2 | `getAvailableQuantity(product)` | `0` |
| TC-17 | Batch — una query per N prodotti | SKU-A: stock=10 committed=3; SKU-B: stock=5 committed=5 | `getAvailableQuantities([prodA, prodB])` | `{SKU-A: 7, SKU-B: 0}` |
| TC-18 | Prodotto senza ordini attivi | product.sku="GHOST", quantity=8, nessun ordine | `getAvailableQuantity(product)` | `8` |
| TC-19 | SKU in più marketplace sommati | 2 ordini PENDING su marketplace diversi, stesso SKU="A", qty=3 ciascuno | `getCommittedQuantities()` | `{A: 6}` |

**Implementation implication per TC-16:** Verificare anche che il log contenga la stringa `"possibile overselling"`. Usare un Logback `ListAppender` collegato al logger `BucketService` in `@BeforeEach`, verificato dopo la chiamata.

```java
// Snippet configurazione ListAppender
Logger logger = (Logger) LoggerFactory.getLogger(BucketService.class);
ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
listAppender.start();
logger.addAppender(listAppender);
// dopo la chiamata:
assertThat(listAppender.list).anyMatch(e ->
    e.getLevel() == Level.WARN &&
    e.getFormattedMessage().contains("possibile overselling"));
```

---

## 6. Test: OrderSyncService.upsertOrders (integration)

File: `orders/sync/OrderSyncServiceIntegrationTest.java`

Estende `OrdersIntegrationTestBase`. Inietta `OrderSyncService`, `OrderRepository`, `OrderItemRepository`, `MarketplaceRepository`.

La `OrderSyncStrategy` usata nei test è una anonymous implementation con:
- `getMarketplaceCode()` → `MarketplaceCode.BRICOBRICO`
- `fetchOrders(since)` → `List.of()` (non usato nei test — si chiama `upsertOrders` direttamente)
- `hasChanged` e `applyUpdates` → default implementations

Chiamata diretta: `orderSyncService.upsertOrders(fetched, strategy, marketplace)`.

**Nota:** `upsertOrders` è `public @Transactional`. La `@Transactional` della classe test avvolge la chiamata in una transazione esterna. Gli effetti sono visibili entro la stessa transazione e vengono rollbackati al termine del test.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-20 | Nuovo ordine — creato | fetched=[1 Order con externalOrderId="EXT-001"] | `created=1 updated=0 skipped=0`; ordine presente in DB |
| TC-21 | Ordine esistente cambiato — aggiornato | ordine "EXT-001" in DB con status=PENDING; fetched=[stesso ID, status=SHIPPED] | `updated=1`; DB ha status=SHIPPED |
| TC-22 | Ordine esistente invariato — skippato | ordine "EXT-001" in DB; fetched=[identico] | `skipped=1`; nessuna write aggiuntiva |
| TC-23 | Eccezione singolo ordine — continua | fetched=[Order con externalOrderId=null, Order valido "EXT-002"] | "EXT-002" salvato; nessuna eccezione propagata; `created=1` |
| TC-24 | Lista vuota | fetched=[] | `created=0 updated=0 skipped=0`; DB invariato |
| TC-25 | Merge items — update in-place | ordine in DB con item (externalItemId="I-1", qty=2); fetched con stesso item qty=5 | ordine aggiornato; `orderItem.id` invariato; qty=5 |
| TC-26 | Merge items — add new | ordine in DB con 1 item (externalItemId="I-1"); fetched con 2 items ("I-1" e "I-2") | ordine ha 2 items; ID del primo invariato |
| TC-27 | Merge items — remove missing | ordine in DB con 2 items ("I-1" e "I-2"); fetched con solo "I-1" | ordine ha 1 item (cascade delete su "I-2") |

**Implementation implication per TC-25/26/27:** Verificare gli ID degli items via `orderItemRepository.findAll()` dopo `upsertOrders`. Salvare l'ID originale prima della chiamata e confrontarlo dopo.

**Implementation implication per TC-23:** `externalOrderId=null` viola il constraint `NOT NULL` nel DB e genera `DataIntegrityViolationException` — esattamente il tipo di eccezione che il service deve gestire per-ordine senza interrompere il ciclo.

---

## 7. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do Instead | Why |
|----------|---------------|-----|
| `webEnvironment = RANDOM_PORT` | `webEnvironment = NONE` | I controller non servono; riduce overhead di ~30% |
| `liquibase.enabled=false` in test | Lasciare Liquibase attivo | I test devono girare sullo stesso schema di prod |
| DB PostgreSQL locale dedicato ai test | Testcontainers | Il DB locale accumula dati residui; lo schema può divergere |
| `@MockBean OrderSyncStrategy` nei test di upsertOrders | Anonymous implementation passata direttamente | `@MockBean` invalida e ricarica il contesto Spring per ogni classe che lo usa |
| Testare `hasChanged`/`applyUpdates` con Spring context | Classe JUnit 5 plain | Sono pura logica Java; il context è overhead inutile |
| Pulizia manuale con `@AfterEach` (`deleteAll()`, ecc.) | `@Transactional` sulla base class | Il rollback è più veloce e non lascia stato residuo in caso di test fallito |
| Chiamare `syncAllScheduled()` nei test | Chiamare `upsertOrders()` direttamente | `syncAllScheduled` chiama API marketplace esterne via `fetchOrders` |
| Condividere campi mutabili tra test senza reset | `@BeforeEach` per reinizializzare ogni test | Due test che modificano lo stesso campo si influenzano a vicenda |
| Verificare log con `System.out.println` | Logback `ListAppender` su `BucketService.class` logger | `System.out` non intercetta SLF4J; `ListAppender` ispeziona messaggi e livelli |
| Un singolo test "God" che verifica tutto il flusso | Test atomici per scenario | Un test che fallisce per più ragioni è impossibile da diagnosticare |

---

## 8. References

| Topic | Location |
|-------|----------|
| Orders module spec | `docs/specs/orders-module-spec.md` |
| Order entity | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/models/Order.java` |
| OrderItem entity | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/models/OrderItem.java` |
| BucketService | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/BucketService.java` |
| OrderSyncService | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/sync/OrderSyncService.java` |
| OrderSyncStrategy | `backend/src/main/java/com/fatellicaterinasrl/fatellisync/orders/sync/OrderSyncStrategy.java` |
| Liquibase changelog orders | `backend/src/main/resources/db-changelogs/changelogs/changelog-orders.xml` |
| build.gradle | `backend/build.gradle` |
