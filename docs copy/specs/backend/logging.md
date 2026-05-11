# Logging Specification

**Tipo documento:** Implementation (Reference)
**Versione:** 2.0
**Data:** 2026-05-10

---

## Scope

Single source of truth for logging decisions across the backend. Every new or modified component must follow these rules without exceptions. All log messages must be written in **English**.

---

## Logger: BeeLogger

All application code uses `BeeLogger` from `com.fatellicaterinasrl.fatellisync.shared.logging`. Never use `@Slf4j` or `LoggerFactory.getLogger()` directly.

```java
// Declaration — one per class, static final
private static final BeeLogger logger = BeeLogger.getLogger(ClassName.class, Color.CYAN);
```

`BeeLogger` wraps SLF4J/Logback and applies a per-class ANSI color to all messages. The color is visible in the terminal and identifies the source section at a glance.

---

## Color Assignment

Color encodes the **section** (datasource or engine), not the class type.

| Section | Color          | Classes |
|---------|----------------|---------|
| TAXI datasource | `RED`          | `TaxiIndexingStrategy`, `TaxiPriceCalculationStrategy` |
| LELLO datasource | `LIGHT_GREEN`  | `LelloIndexingStrategy`, `LelloPriceCalculationStrategy` |
| CARMECCANICA datasource | `LIGHT_YELLOW` | `CarMeccanicaIndexingStrategy`, `CarMeccanicaPriceCalculationStrategy` |
| Indexing engine | `LIGHT_WHITE`  | `IndexingScheduler`, `ProductIndexer` |
| Publication engine | `LIGHT_WHITE`       | `PublicationRefreshJob`, `BricoBravoPublicationStrategy` |
| Sync engine | `LIGHT_WHITE`        | `MarketplaceService` |
| BricoBravo marketplace | `PURPLE`       | `BricoBravoSyncStrategy` |
| Price engine | `LIGHT_WHITE`   | `PriceService` |

---

## Level Semantics

| Level | When to use | Stacktrace? |
|-------|-------------|-------------|
| `INFO`  | Lifecycle start and complete of a scheduler or top-level job. Always includes aggregated counts at completion. | Never |
| `DEBUG` | Macro operations within a job: fetching data, writing files, processing a batch, count of records obtained. | Never |
| `TRACE` | Single-item operations: processing one product, inserting one PM, evaluating one price. | Never |
| `WARN`  | Unexpected but recoverable: null price, missing strategy, excluded product, unknown marketplace code. | Never |
| `ERROR` | Operation failed, data lost, requires human attention. | Always |

---

## Ownership Model

> **The component that owns the lifecycle logs INFO. Strategies log only WARN/ERROR.**

```
Scheduler          → INFO: "starting" + "complete" with counts
  └── Job/Engine   → DEBUG: fetch data, process batch, write output
        └── Strategy → WARN/ERROR: per-item failures only
```

This prevents the same event from being logged at INFO by multiple components.

---

## Rules by Component Type

### Scheduler (`@Scheduled`)

| Event | Level | Pattern |
|-------|-------|---------|
| Method entry | INFO | `"ClassName: operation starting — param=X"` |
| Method exit | INFO | `"ClassName: operation complete — N items processed"` |
| Per-strategy/datasource iteration | DEBUG | `"ClassName: running strategy for datasource=X"` |
| Unrecoverable error on sub-task | ERROR | `"ClassName: error for param=X: msg"` + stacktrace |

---

### Job / Engine (`@Transactional`, batch logic)

| Event | Level | Pattern |
|-------|-------|---------|
| Entry with context | DEBUG | `"ClassName: fetching X for marketplace=Y..."` |
| Data obtained | DEBUG | `"ClassName: got N records for marketplace=Y"` |
| Writing output | DEBUG | `"ClassName: writing X to path..."` |
| Chunk/batch complete (multi-chunk only) | DEBUG | `"ClassName: chunk N — ok=M errors=P"` |
| Aggregated result at completion | INFO | `"ClassName: Y — created=N updated=M failed=P"` |
| Single item not processable | WARN | `"ClassName: reason for sku=X marketplace=Y"` |
| Exception on single item | ERROR | `"ClassName: error processing sku=X: msg"` + stacktrace |
| Exception on chunk | ERROR | `"ClassName: error in chunk page=N: msg"` + stacktrace |

---

### Strategy (interface implementations)

| Event | Level | Pattern |
|-------|-------|---------|
| Data not found / not calculable | WARN | `"ClassName: reason for sku=X marketplace=Y"` |
| Malformed data (JSON, format) | ERROR | `"ClassName: failed to parse X for sku=Y"` + stacktrace |
| Unsupported marketplace | WARN | `"ClassName: marketplace=X not supported, returning null"` |
| Single item skipped (zero price, etc.) | TRACE | `"ClassName: skipping sku=X — reason"` |

No INFO in strategies. The calling job logs lifecycle.

---

### Service (`@Service`, `@PostConstruct`)

| Event | Level | Pattern |
|-------|-------|---------|
| No strategy registered | WARN | `"ClassName: no XStrategy registered for Y — operation will be a no-op"` |
| Startup failure | ERROR | let exception propagate |

---

## Message Format

### Required prefix

Every message starts with the simple class name followed by `: `

```
"TaxiIndexingStrategy: opening DBF file: artmag.dbf"
"PublicationRefreshJob: BRICOBRAVO — eligible=847, created=12"
```

### Parameter format

```
param=value          ✓
param: value         ✗
param = "value"      ✗  (only quote values with spaces)
```

### Counts

```
eligible=847 created=12 errors=0    ✓
847 products found, 12 created      ✗  (prose)
processed 847/847 successfully      ✗  ("successfully" is banned)
```

### Banned words

| Word / phrase | Reason |
|---|---|
| `successfully` | INFO implies success |
| `done` | use `complete` |
| `Error occurred` | describe what failed |
| `Something went wrong` | describe what failed |
| Any Italian word | all messages must be in English |

---

## Logback Configuration

```xml
<!-- Framework: always WARN regardless of LOG_LEVEL -->
<logger name="org.hibernate"        level="WARN"/>
<logger name="org.springframework"  level="WARN"/>
<logger name="org.apache"           level="WARN"/>
<logger name="com.zaxxer.hikari"    level="WARN"/>
<logger name="liquibase"            level="WARN"/>
<logger name="net.javacrumbs"       level="WARN"/>

<!-- Application code inherits from root (LOG_LEVEL env var) -->
<root level="${LOG_LEVEL:-INFO}">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
</root>
```

**`LOG_LEVEL` per environment:**

| Environment | Value | Visible logs |
|---|---|---|
| Production | `INFO` | Lifecycle events + warnings + errors |
| Development | `DEBUG` | + macro operations (fetches, batch stats, file writes) |
| Deep debug | `TRACE` | + per-item operations (one line per product/PM) |

Set `LOG_LEVEL=DEBUG` in `application-dev.yaml` or as env var.

---

## Anti-Patterns (DO NOT)

| ❌ Do not | ✅ Do instead                                                       | Why |
|---|--------------------------------------------------------------------|---|
| `@Slf4j` annotation | `private static final BeeLogger logger = BeeLogger.getLogger(...)` | BeeLogger adds colors and is the project standard |
| `log.info(...)` inside a Strategy | `log.warn(...)` or `log.error(...)` only                           | The calling Job logs lifecycle — duplication creates noise |
| `log.info(...)` for per-item operations | `log.trace(...)`                                                   | 50k products at INFO = 50k lines; unreadable |
| `log.debug(...)` in application code without a check | already guarded by `isDebugEnabled()` inside BeeLogger             | no action needed, BeeLogger handles it internally |
| Stacktrace on WARN | stacktrace only on ERROR                                           | WARN is recoverable: stack detail is irrelevant |
| Silent catch: `catch (Exception e) {}` | at minimum `log.error(..., e)`                                     | silent exceptions are invisible in production |
| Italian in log messages | English only                                                       | consistent language for searchability and tooling |
| `"successfully"` in message text | remove — INFO level implies success                                | redundant noise |

---

## Error Handling Matrix

| Scenario | Level | Stacktrace | Pattern |
|---|---|---|---|
| Strategy not registered for datasource | WARN | No | `"no XStrategy for datasource=Y"` |
| Strategy not registered for marketplace | WARN | No | `"no XStrategy for marketplace=Y"` |
| `calculatePrice()` returns null | WARN | No | `"calculated_price=null for sku=X marketplace=Y"` |
| Product excluded by business filter (EAN, stepQty) | TRACE | No | `"skipping sku=X — reason"` |
| Exception on single product in batch | ERROR | Yes | `"error processing sku=X for marketplace=Y: msg"` |
| Exception on entire chunk | ERROR | Yes | `"error in chunk page=N: msg"` |
| Exception on entire marketplace in scheduler | ERROR | Yes | `"error for marketplace=X: msg"` |
| File write failure (CSV) | ERROR | Yes | `"failed to write feed to path=X: msg"` |
| Malformed JSON in `product.properties` | ERROR | Yes | `"failed to parse properties for sku=X"` |
| Unknown marketplace code | WARN | No | `"unknown marketplace code: X"` |

---

## References

| Content | Document |
|---|---|
| BeeLogger source | `shared/logging/BeeLogger.java` |
| Color palette | `shared/logging/Color.java` |
| Logback config | `backend/src/main/resources/logback-spring.xml` |
| Sync Engine — syncBatch logging contract | [sync-engine.md](marketplace/sync-engine.md) |
| Publication Engine — refreshPublications logging | [publication-engine.md](marketplace/publication-engine.md) |
| Price Engine — calculate() logging | [price-engine.md](marketplace/price-engine.md) |
