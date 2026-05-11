# FatelliSync — Test Spec (Implementation)

## 1. Scope

Test per tutti i moduli di `specs/`. Copre la logica di business verificabile senza dipendenze da hardware fisico o API marketplace reali.

### Componenti in scope

| Componente | Tipo test | File spec sorgente |
|------------|-----------|-------------------|
| `TaxiPriceCalculationStrategy` | Unit | `specs/core/marketplace/price-taxi.md` |
| `ProductMarketplace.getFinalPrice()` | Unit | `specs/core/marketplace/product-marketplaces.md` |
| `PriceService` dispatch | Integration | `specs/core/marketplace/price-engine.md` |
| `MarketplaceService.syncMarketplace` | Integration | `specs/core/marketplace/sync-engine.md` |
| `MarketplaceService.syncAll` | Integration | `specs/core/marketplace/sync-engine.md` |
| `PublicationRefreshJob` | Integration | `specs/core/marketplace/publication-engine.md` |
| `ProductIndexer` upsert core | Integration | `specs/core/products/indexer.md` |
| `ImageService` (SKU extraction) | Unit | `specs/core/products/images.md` |
| `ImageController` endpoint | Integration | `specs/core/products/images.md` |
| `OrderSyncStrategy` default methods | Unit | `docs/specs/orders-module-spec.md` |
| `BucketService` | Integration | `docs/specs/orders-module-spec.md` |
| `OrderSyncService.upsertOrders` | Integration | `docs/specs/orders-module-spec.md` |
| `OrderSyncService.syncOrders` (finestra since) | Integration | `docs/specs/orders-module-spec.md` |

### Componenti NON in scope

| Componente | Motivazione esclusione |
|------------|------------------------|
| `TaxiIndexingStrategy` | Richiede file DBF su filesystem specifico Windows |
| `LelloIndexingStrategy` | Richiede server FTP reale con ZIP/TXT specifici |
| `CarMeccanicaIndexingStrategy` | Richiede endpoint HTTP esterno con formato XML proprietario |
| Implementazioni concrete `OrderSyncStrategy` | Richiedono API marketplace esterne |
| `ImageService` (source loading, encoding) | Richiede immagini reali su disco o HTTP; unit test coprono la logica rilevante |
| Configurazione Docker/nginx | Infrastruttura, non logica di business |
| Frontend (Next.js / Prisma) | Stack separato, non gestito da questo test suite |

---

## 2. Dipendenze (build.gradle)

Aggiungere nel blocco `dependencies`:

```groovy
testImplementation 'org.springframework.boot:spring-boot-testcontainers'
testImplementation 'org.testcontainers:junit-jupiter'
testImplementation 'org.testcontainers:postgresql'
```

Le versioni sono gestite dalla BOM `spring-boot-dependencies:4.0.6`.

---

## 3. Infrastruttura di test

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

`"-"` disabilita i `@Scheduled` in Spring Framework 7.x. Liquibase non viene overriddato — applica gli stessi changelog di produzione.

### 3.2 IntegrationTestBase

File: `backend/src/test/java/com/fatellicaterinasrl/fatellisync/IntegrationTestBase.java`

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
@Transactional
public abstract class IntegrationTestBase {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");
}
```

- Container `static`: avviato una volta per JVM run, condiviso tra tutte le classi che estendono la base
- `@Transactional` sulla classe: rollback automatico dopo ogni `@Test`
- `@ServiceConnection`: Spring Boot configura `spring.datasource.*` automaticamente
- Liquibase esegue una sola volta all'avvio del contesto Spring

### 3.3 Dati di base

Liquibase (changelog-marketplaces.xml) inserisce 6 marketplace con ID fissi (1–6). I test accedono via `marketplaceRepository.findById(1L)` per BRICOBRICO.

### 3.4 Package structure dei test

```
backend/src/test/java/com/fatellicaterinasrl/fatellisync/
├── IntegrationTestBase.java
├── core/
│   ├── marketplace/
│   │   ├── TaxiPriceCalculationStrategyTest.java       (unit)
│   │   ├── ProductMarketplaceTest.java                 (unit)
│   │   ├── PriceServiceIntegrationTest.java            (integration)
│   │   ├── MarketplaceServiceIntegrationTest.java      (integration)
│   │   └── PublicationRefreshJobIntegrationTest.java   (integration)
│   ├── indexing/
│   │   └── ProductIndexerIntegrationTest.java          (integration)
│   └── services/
│       ├── ImageServiceSkuExtractionTest.java          (unit)
│       └── ImageControllerIntegrationTest.java         (integration)
└── orders/
    ├── BucketServiceIntegrationTest.java               (integration)
    └── sync/
        ├── OrderSyncStrategyTest.java                  (unit)
        └── OrderSyncServiceIntegrationTest.java        (integration)
```

---

## 4. TaxiPriceCalculationStrategy (unit, no Spring)

File: `core/marketplace/TaxiPriceCalculationStrategyTest.java`

Classe JUnit 5 plain. Istanzia `TaxiPriceCalculationStrategy` direttamente, senza Spring context.

Il campo `product.properties` è una stringa JSON con struttura `{"listini":[{"name":"BRICOBRICO","price":12.34567,"iva":22},...]}`.

### 4.1 Mapping marketplace → listino

| ID | MarketplaceCode | Listino atteso |
|----|----------------|---------------|
| TC-01 | `BRICOBRICO` | `"BRICOBRICO"` |
| TC-02 | `AMAZON_IT` | `"AMAZON"` |
| TC-03 | `MANOMANO_IT` | `"BBLMMANO"` |
| TC-04 | `LEROY_MERLIN` | `"BBLMMANO"` |
| TC-05 | `BRICOBRAVO` | `"BBLMMANO"` |
| TC-06 | `FATELLI_CATERINA` | `"INGROSSO"` |

Usare `@ParameterizedTest` con tutti e 6 i casi. Verifica: il listino estratto dal JSON corrisponde al nome atteso e il prezzo restituito è non-null.

### 4.2 Estrazione prezzo

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-07 | Prezzo valido | `properties` con listino BRICOBRICO price=15.50000 | `BigDecimal("15.50000")` (5 decimali) |
| TC-08 | Prezzo zero → null | listino BRICOBRICO price=0 | `null` + WARN loggato |
| TC-09 | Listino assente per marketplace | `properties` senza listino BRICOBRICO | `null` + WARN loggato |
| TC-10 | `properties` null | `product.properties = null` | `null` + WARN/ERROR loggato |
| TC-11 | `properties` JSON non parsabile | `product.properties = "{malformed"` | `null` + ERROR loggato |
| TC-12 | Marketplace sconosciuto (non TAXI) | MarketplaceCode senza mapping | `null` + WARN loggato |

**Implementation implication:** Per TC-08/09/10/11/12, verificare il log con Logback `ListAppender` sul logger `TaxiPriceCalculationStrategy`. Il metodo `calculate()` non deve mai lanciare eccezioni — tutti i casi di errore restituiscono `null`.

---

## 5. ProductMarketplace.getFinalPrice() (unit, no Spring)

File: `core/marketplace/ProductMarketplaceTest.java`

Classe JUnit 5 plain. Crea istanze `ProductMarketplace` via costruttore/setter.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-13 | Prezzo calcolato, no override | `calculatedPrice=100.00`, `multiplier=1.5`, `priceOverridden=false` | `150.00` |
| TC-14 | Override attivo | `priceOverride=80.00`, `priceOverridden=true`, `multiplier=2.0` | `160.00` |
| TC-15 | `calculatedPrice=null`, no override | `calculatedPrice=null`, `priceOverridden=false` | `null` |
| TC-16 | `priceOverridden=true`, `priceOverride=null` | — | `null` (DB constraint impedisce questo stato in prod; il metodo deve gestirlo comunque) |
| TC-17 | Moltiplicatore default | `calculatedPrice=50.00`, `multiplier=1.0` (default) | `50.00` |
| TC-18 | Precisione decimale | `calculatedPrice=1.33333`, `multiplier=3.0` | `3.99999` (5 decimali, no arrotondamento in getFinalPrice) |

---

## 6. MarketplaceService.syncMarketplace (integration)

File: `core/marketplace/MarketplaceServiceIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `MarketplaceService`, `ProductMarketplaceRepository`, `MarketplaceRepository`.

La `MarketplaceSyncStrategy` è una anonymous implementation (non `@MockBean`):
- `getMarketplaceCode()` → `BRICOBRICO`
- `syncBatch(items)` → configurabile per test (success totale, errori parziali, eccezione totale)

Il marketplace BRICOBRICO viene recuperato via `marketplaceRepository.findById(1L)`.

I `ProductMarketplace` di test hanno `enabled=true` e `calculatedPrice` valorizzata (price guard superato).

### Price guard — selezione prodotti

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-19 | Prodotto con `calculatedPrice` → incluso | `pm.calculatedPrice=10.00`, `pm.priceOverridden=false` | prodotto inviato a `syncBatch` |
| TC-20 | Prodotto con `priceOverride` → incluso | `pm.priceOverridden=true`, `pm.priceOverride=20.00` | prodotto inviato a `syncBatch` |
| TC-21 | `calculatedPrice=null`, no override → escluso | `pm.calculatedPrice=null`, `pm.priceOverridden=false` | prodotto NON inviato a `syncBatch` |

### Scrittura risultati sync

| ID | Scenario | Strategy response | Expected stato `pm` |
|----|----------|-------------------|---------------------|
| TC-22 | Successo | `skuErrors` vuoto | `syncStatus=SUCCESS`, `lastSyncedAt` non null, `retryCount=0` |
| TC-23 | Errore singolo prodotto | `skuErrors={sku→"timeout"}` | `syncStatus=ERROR`, `syncErrorMessage="timeout"`, `retryCount++` |
| TC-24 | Reset retry su successo | `pm.retryCount=3`, strategy successo | `retryCount=0` |

### Backoff

| ID | `retryCount` | `pm.updatedAt` | Expected |
|----|-------------|----------------|----------|
| TC-25 | 1 | `now - 30min` | prodotto NON selezionato (backoff 1h non scaduto) |
| TC-26 | 1 | `now - 2h` | prodotto selezionato (backoff 1h scaduto) |
| TC-27 | 2 | `now - 3h` | NON selezionato (backoff 4h) |
| TC-28 | 4 | `now - 25h` | selezionato (backoff 24h scaduto) |

**Implementation implication per TC-25/26/27/28:** Impostare `pm.updatedAt` direttamente tramite JPQL update o setter prima del test, per simulare gli intervalli di backoff rispetto a `NOW()`.

### syncAll — orchestrazione multi-marketplace

Chiama `marketplaceService.syncAll()` direttamente. Le strategy per ogni marketplace sono anonymous implementations registrate tramite una `@TestConfiguration` che sovrascrive il bean `List<MarketplaceSyncStrategy>`.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-66 | 2 marketplace enabled, entrambi con strategy | marketplace BRICOBRICO e MANOMANO_IT abilitati, strategy per entrambi | `syncBatch` chiamato su entrambe le strategy |
| TC-67 | Marketplace senza strategy registrata | BRICOBRICO abilitato, nessuna strategy per quel code | WARN loggato, no eccezione propagata |
| TC-68 | Strategy lancia eccezione per un marketplace | strategy BRICOBRICO lancia `RuntimeException` | MANOMANO_IT ancora processato, eccezione BRICOBRICO loggata come ERROR |
| TC-69 | Nessun marketplace abilitato | tutti i marketplace con `enabled=false` | nessun `syncBatch` chiamato, nessuna eccezione |

**Implementation implication:** Usare `@TestConfiguration` + `@Primary` per sostituire le strategy con anonymous implementations che registrano le chiamate ricevute (es. via `AtomicBoolean` o `List<ProductMarketplace>`).

---

## 7. PublicationRefreshJob (integration)

File: `core/marketplace/PublicationRefreshJobIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `PublicationRefreshJob`, `ProductMarketplaceRepository`, `ProductRepository`, `MarketplaceRepository`.

I test richiedono `Product` nel DB: creare con i campi NOT NULL obbligatori (sku, name, data_source_id, category_id, total_amount_vat_inc). Usare DataSource.MANUAL e una categoria esistente (inserita da Liquibase).

### createInitialEntry

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-29 | Nuova entry eligibile | prodotto attivo, nessun `pm` esistente | `pm` creato con `enabled=true`, `multiplier=1.0`, `syncStatus=null` |
| TC-30 | Entry già esistente → ignorata | `pm` già presente | `pm` invariato (nessun update) |
| TC-31 | `calculatedPrice=null` → entry creata comunque | `PriceService` restituisce null per il prodotto | `pm` creato con `calculatedPrice=null`; entry pubblicata ma non sincronizzata (price guard nel SyncEngine) |

### refreshPrices

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-32 | Prezzo cambiato → aggiornato | `pm.calculatedPrice=10.00`, nuovo calcolo=15.00 | `pm.calculatedPrice=15.00` |
| TC-33 | Prezzo invariato → nessuna write | `pm.calculatedPrice=10.00`, nuovo calcolo=10.00 | nessun UPDATE emesso (verificabile via `pm.updatedAt` invariato) |
| TC-34 | Entry con `priceOverridden=true` → esclusa | — | `pm.calculatedPrice` non viene toccato |

---

## 8. ImageService — SKU extraction (unit, no Spring)

File: `core/services/ImageServiceSkuExtractionTest.java`

Classe JUnit 5 plain. Testa solo la logica di estrazione SKU dal filename — il metodo di parsing interno a `ImageService`.

**Implementation implication:** Se il metodo di parsing è `private`, esporre un metodo `package-private` o usare reflection. Alternativa: spostare la logica di parsing in un metodo `static` con visibilità `package-private`.

| ID | Input filename | Expected SKU |
|----|---------------|-------------|
| TC-35 | `sku-123.webp` | `sku-123` |
| TC-36 | `sku-123_ab12cd34.webp` | `sku-123` (hash suffix rimosso) |
| TC-37 | `sku-123.webp?v=1` | `sku-123` (query string rimossa) |
| TC-38 | `10_123_ab12cd34.webp` | `10_123` → fallback a `10/123` se non trovato |
| TC-39 | `sku-123` (senza estensione) | `sku-123` |

**Implementation implication per TC-38:** La logica di fallback underscore→slash implica un lookup sul filesystem o DB. In un test unit puro, verifica solo che il fallback venga tentato (con l'SKU trasformato correttamente), non che il file esista.

---

## 9. OrderSyncStrategy default methods (unit, no Spring)

File: `orders/sync/OrderSyncStrategyTest.java`

Classe JUnit 5 plain. Anonymous implementation dell'interfaccia per invocare i default methods.

### generateItemId

| ID | Input | Expected |
|----|-------|----------|
| TC-40 | `("ORD-123", 0)` | `"ORD-123-0"` |
| TC-41 | `("ORD-123", 5)` | `"ORD-123-5"` |

### hasChanged

| ID | Scenario | Expected |
|----|----------|----------|
| TC-42 | Due Order identici (tutti i 24 campi uguali) | `false` |
| TC-43 | Un campo diverso — `@ParameterizedTest` su tutti i 24 campi | `true` per ogni caso |

Campi da coprire: `status`, `totalAmountVatInc`, `subtotal`, `shippingCost`, `shippingVatRate`, `currency`, `customerEmail`, `customerPhone`, `billingType`, `billingFirstName`, `billingLastName`, `vatNumber`, `pec`, `sdi`, `shippingFirstName`, `shippingLastName`, `shippingAddress`, `shippingCity`, `shippingPostalCode`, `shippingProvince`, `shippingCountry`, `notes`, `properties`, `orderedAt`.

**Implementation implication:** Usare `@MethodSource` con `Stream<Arguments(String fieldName, Consumer<Order> mutator)>`.

### applyUpdates

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-44 | Campi scalari copiati | `existing` con valori A, `incoming` con valori B per tutti i 24 campi | `existing` ha i valori B |
| TC-45 | Item update in-place | existing: 1 item (externalItemId="I-1", qty=2); incoming: stesso "I-1" qty=5 | item.id invariato, qty=5 |
| TC-46 | Item aggiunto | existing: 1 item ("I-1"); incoming: 2 items ("I-1" e "I-2") | 2 items, ID del primo invariato |
| TC-47 | Item rimosso | existing: 2 items ("I-1" e "I-2"); incoming: solo "I-1" | 1 item (externalItemId="I-1") |
| TC-48 | Item con externalItemId=null non rimosso | existing: 1 item con externalItemId=null; incoming: vuoto | existing ha ancora 1 item |

---

## 10. BucketService (integration)

File: `orders/BucketServiceIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `BucketService`, `OrderRepository`, `MarketplaceRepository`.

Il `Product` per `getAvailableQuantity` è costruito in memoria (non persistito) con solo `sku` e `quantity` valorizzati.

| ID | Scenario | Setup | Metodo | Expected |
|----|----------|-------|--------|----------|
| TC-49 | PENDING + CONFIRMED sommati | ordine PENDING (SKU="A", qty=3) + CONFIRMED (SKU="A", qty=2) | `getCommittedQuantities()` | `{A: 5}` |
| TC-50 | SHIPPED escluso | ordine SHIPPED (SKU="A", qty=10) | `getCommittedQuantities()` | senza chiave "A" |
| TC-51 | CANCELLED escluso | ordine CANCELLED (SKU="A", qty=10) | `getCommittedQuantities()` | senza chiave "A" |
| TC-52 | SKU null ignorato | ordine PENDING, item SKU=null qty=5 | `getCommittedQuantities()` | mappa vuota |
| TC-53 | Disponibile normale | PENDING qty=3; product.quantity=10 | `getAvailableQuantity(product)` | `7` |
| TC-54 | Stock mismatch → 0 + WARN | PENDING qty=5; product.quantity=2 | `getAvailableQuantity(product)` | `0` + WARN con "possibile overselling" |
| TC-55 | Batch — una sola query | SKU-A: stock=10 committed=3; SKU-B: stock=5 committed=5 | `getAvailableQuantities([A,B])` | `{SKU-A: 7, SKU-B: 0}` |
| TC-56 | Prodotto senza ordini attivi | product.sku="GHOST", quantity=8 | `getAvailableQuantity(product)` | `8` |
| TC-57 | SKU su più marketplace sommati | 2 ordini PENDING marketplace diversi, SKU="A" qty=3 ciascuno | `getCommittedQuantities()` | `{A: 6}` |

**Implementation implication per TC-54:** Verificare log con Logback `ListAppender` sul logger di `BucketService`.

---

## 11. OrderSyncService.upsertOrders (integration)

File: `orders/sync/OrderSyncServiceIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `OrderSyncService`, `OrderRepository`, `OrderItemRepository`, `MarketplaceRepository`.

`OrderSyncStrategy` usata: anonymous implementation con `getMarketplaceCode()=BRICOBRICO` e default methods.

Chiamata diretta: `orderSyncService.upsertOrders(fetched, strategy, marketplace)`.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-58 | Nuovo ordine — creato | fetched=[Order "EXT-001"] | `created=1 updated=0 skipped=0`; ordine in DB |
| TC-59 | Ordine cambiato — aggiornato | ordine "EXT-001" PENDING in DB; fetched=[stesso ID, status=SHIPPED] | `updated=1`; DB ha status=SHIPPED |
| TC-60 | Ordine invariato — skippato | ordine "EXT-001" in DB; fetched=[identico] | `skipped=1` |
| TC-61 | Eccezione singolo ordine — continua | fetched=[Order externalOrderId=null, Order valido "EXT-002"] | "EXT-002" salvato; nessuna eccezione propagata |
| TC-62 | Lista vuota | fetched=[] | `created=0 updated=0 skipped=0` |
| TC-63 | Merge items — update in-place | ordine in DB con item (externalItemId="I-1", qty=2); fetched qty=5 | item.id invariato, qty=5 |
| TC-64 | Merge items — add new | ordine con 1 item "I-1" in DB; fetched con "I-1" e "I-2" | 2 items; ID del primo invariato |
| TC-65 | Merge items — remove missing | ordine con 2 items in DB; fetched con solo "I-1" | 1 item in DB (cascade delete su "I-2") |

**Implementation implication per TC-61:** `externalOrderId=null` viola `NOT NULL` nel DB → `DataIntegrityViolationException`. Questo è il tipo di eccezione che il service deve assorbire per-ordine senza interrompere il ciclo.

### Finestra since — syncOrders manuale

| ID | Scenario | Chiamata | Expected |
|----|----------|----------|----------|
| TC-66b | `syncOrders(code)` → `since=null` | `orderSyncService.syncOrders(BRICOBRICO)` con strategy che cattura `since` | `fetchOrders(null)` chiamato |

**Implementation implication:** La strategy cattura il parametro `since` ricevuto in `fetchOrders` tramite un campo `AtomicReference<LocalDateTime>`. Il test verifica che il valore sia `null` dopo la chiamata.

---

## 12. PriceService (integration)

File: `core/marketplace/PriceServiceIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `PriceService`.

Il `Product` è costruito in memoria (non persistito) con `dataSourceId` impostato al valore corrispondente alla DataSource da testare, e `properties` JSON con un listino valido.

| ID | Scenario | Setup | Expected |
|----|----------|-------|----------|
| TC-70 | DataSource=TAXI con listino valido | `product.dataSourceId=1` (TAXI), properties con listino BRICOBRICO price=15.00 | prezzo non-null, `BigDecimal` con 5 decimali |
| TC-71 | DataSource senza strategy registrata | `product.dataSourceId` corrispondente a LELLO o C_AND_C (strategy non implementata) | `null` + WARN loggato |
| TC-72 | DataSource=TAXI, listino mancante per marketplace | properties senza listino AMAZON | `null` (delegato a TaxiPriceCalculationStrategy) |

**Implementation implication:** Verificare TC-71 con Logback `ListAppender`. Il metodo `calculatePrice()` non deve mai lanciare eccezioni — anche quando la strategy è assente.

---

## 13. ProductIndexer upsert core (integration)

File: `core/indexing/ProductIndexerIntegrationTest.java`

Estende `IntegrationTestBase`. Inietta `ProductIndexer`, `ProductRepository`.

La `IndexingStrategy` usata nei test è una anonymous implementation che restituisce una lista fissa di `Product` oggetti. Non richiede file DBF, FTP o HTTP.

**Setup:** Prima di ogni test, garantire che il DB sia pulito (gestito da `@Transactional` rollback). I Product da creare/aggiornare devono avere i campi NOT NULL obbligatori (sku, name, data_source_id, category_id).

| ID | Scenario | Setup strategy stream | Expected in DB |
|----|----------|-----------------------|----------------|
| TC-73 | SKU nuovo → creato | stream con 1 Product SKU="NEW-001" | prodotto creato, `is_active=true` |
| TC-74 | SKU esistente, stessa DataSource → campi aggiornati | prodotto SKU="EX-001" in DB; stream restituisce stesso SKU con `brand` diversa | `brand` aggiornata |
| TC-75 | SKU esistente, DataSource diversa → solo campi `@ManagedBy` quella source aggiornati | prodotto SKU="EX-001" con `brand` settata da TAXI; stream da LELLO restituisce stesso SKU con `brand` diversa | `brand` NON sovrascritta (TAXI la gestisce) |
| TC-76 | SKU in DB prima del run ma non nel stream → deactivato | prodotto SKU="OLD-001" in DB, `is_active=true`; stream non lo contiene | `is_active=false` |
| TC-77 | Quantità negativa nel stream → azzerata | stream restituisce Product con `quantity=-5` | prodotto salvato con `quantity=0` |
| TC-78 | Report contatori corretti | stream con 1 nuovo + 1 aggiornamento; 1 prodotto in DB non nel stream | `IndexingReport.created=1, updated=1, deactivated=1` |

**Implementation implication per TC-75:** La DataSource del prodotto in DB (es. TAXI) e quella del stream di test (es. LELLO) devono essere diversi valori dell'enum `DataSource`. Verificare che il campo `@ManagedBy(TAXI)` non venga sovrascritto dall'indicizzazione LELLO.

**Implementation implication per TC-78:** `IndexingReport` è il tipo restituito dal metodo di indicizzazione (`ProductIndexer.index(strategy)` o equivalente). Verificare i campi `created`, `updated`, `deactivated` dopo la chiamata.

---

## 14. ImageController endpoint (integration)

File: `core/services/ImageControllerIntegrationTest.java`

Usa `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` oppure `@AutoConfigureMockMvc` + `MockMvc`. A differenza degli altri test, questo richiede il layer web attivo.

`ImageService` viene sostituito con `@MockBean` — l'obiettivo è testare il routing HTTP e la gestione della risposta, non la logica di elaborazione immagini.

| ID | Scenario | Mock ImageService | Request | Expected |
|----|----------|-------------------|---------|----------|
| TC-79 | SKU trovato → 200 con bytes | restituisce `byte[]` non-vuoto per qualsiasi input | `GET /images/product/sku-123_ab12cd34.webp` | HTTP 200, `Content-Type: image/webp` |
| TC-80 | SKU non trovato → 404 | lancia eccezione o restituisce null | `GET /images/product/unknown.webp` | HTTP 404 |
| TC-81 | Filename passato correttamente a ImageService | verifica l'argomento ricevuto | `GET /images/product/sku-123_ab12cd34.webp` | ImageService riceve `"sku-123_ab12cd34.webp"` come filename |

**Implementation implication:** `@MockBean ImageService` IN questo test invalida il contesto Spring — questa classe NON deve estendere `IntegrationTestBase` ma avere il proprio contesto isolato. Il Testcontainers container resta necessario (Liquibase deve girare), quindi dichiarare `@Container @ServiceConnection` nella classe stessa (non ereditato).

---

## 15. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do Instead | Why |
|----------|---------------|-----|
| `@MockBean` per `MarketplaceSyncStrategy` o `OrderSyncStrategy` | Anonymous implementation passata direttamente | `@MockBean` invalida il contesto Spring, forza ricaricamento per ogni classe che lo usa |
| `webEnvironment = RANDOM_PORT` | `webEnvironment = NONE` | I controller non servono nei test di business logic; riduce overhead |
| `liquibase.enabled=false` | Lasciare Liquibase attivo | I test devono girare sullo stesso schema di prod — è l'intera ragione di usare Testcontainers |
| DB PostgreSQL locale dedicato ai test | Testcontainers | Il DB locale accumula dati residui; lo schema può divergere da prod |
| `@BeforeEach` con `deleteAll()` per pulizia | `@Transactional` sulla base class | Il rollback è atomico e più veloce; `deleteAll` fallisce silenziosamente se c'è stato residuo da altri test |
| Testare logica pura (price calculation, SKU extraction, hasChanged) con Spring context | Classi JUnit 5 plain | Il context è overhead inutile; riduce il feedback loop da secondi a millisecondi |
| Verificare log con `System.out` o `System.err` | Logback `ListAppender` sul logger della classe | `System.out` non intercetta SLF4J |
| `@Test` che verifica più scenari in sequenza | Un `@Test` per scenario | Un test che fallisce per ragioni multiple è impossibile da diagnosticare |
| Impostare `pm.updatedAt` via setter JPA per i test di backoff | JPQL update diretto: `UPDATE ProductMarketplace SET updatedAt = :t WHERE id = :id` | JPA listener `@LastModifiedDate` sovrascrive il setter prima del flush |
| `splitStatements=false` mancante nei changeset Liquibase con `CREATE FUNCTION` | Aggiungere `splitStatements="false"` | Liquibase splitta su `;` di default e rompe i function body PL/pgSQL |

---

## 16. References

| Topic | Location |
|-------|----------|
| Strategic blueprint | `specs/strategic-blueprint.md` |
| Marketplace overview | `specs/core/marketplace/marketplace.md` |
| Price Rule Engine spec | `specs/core/marketplace/price-engine.md` |
| TAXI price strategy spec | `specs/core/marketplace/price-taxi.md` |
| ProductMarketplace model spec | `specs/core/marketplace/product-marketplaces.md` |
| Sync Engine spec | `specs/core/marketplace/sync-engine.md` |
| Publication Engine spec | `specs/core/marketplace/publication-engine.md` |
| Product Indexer spec | `specs/core/products/indexer.md` |
| Images spec | `specs/core/products/images.md` |
| Orders module spec | `docs/specs/orders-module-spec.md` |
| Orders test spec (dettaglio ordini) | `docs/specs/orders-module-test-spec.md` |
| build.gradle | `backend/build.gradle` |
| IntegrationTestBase | `backend/src/test/java/com/fatellicaterinasrl/fatellisync/IntegrationTestBase.java` |
| FatellisyncApplicationTests (context load esistente) | `backend/src/test/java/com/fatellicaterinasrl/fatellisync/FatellisyncApplicationTests.java` |
