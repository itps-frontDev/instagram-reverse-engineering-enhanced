# Marketplace Module — Overview

**Tipo documento:** Implementation (Index)
**Versione:** 2.0
**Data:** 2026-05-04

---

## Package

Tutti gli engine di questo modulo appartengono al submodule `marketplace` del modulo `core`:

```
com.fatellicaterinasrl.fatellisync.core.marketplace
```

---

## Scopo

Il modulo marketplace gestisce la relazione tra il catalogo prodotti interno e i canali di vendita esterni. Per ogni prodotto × marketplace tiene traccia dello stato di pubblicazione, del prezzo calcolato e dell'esito delle sincronizzazioni.

Il modulo è composto da tre engine distinti:

| Engine | Responsabilità | Spec |
|---|---|---|
| **Price Rule Engine** | Calcola il prezzo di vendita per ogni (prodotto, marketplace) in base alla sorgente dati | [price-engine.md](price-engine.md) |
| **Sync Engine** | Seleziona i prodotti da aggiornare e invia le variazioni verso i marketplace | [sync-engine.md](sync-engine.md) |
| **Publication Engine** | Gestisce il ciclo di vita delle associazioni prodotto ↔ marketplace | [publication-engine.md](publication-engine.md) |

Il modello dati condiviso tra tutti e tre gli engine è descritto in [product-marketplaces.md](product-marketplaces.md).

---

## Enum `MarketplaceCode`

Ogni valore ha un ID numerico stabile che corrisponde all'`id` nella tabella `marketplaces`.

| Enum | ID | Note |
|---|---|---|
| `BRICOBRICO` | 1 | WooCommerce |
| `MANOMANO_IT` | 2 | API dedicata |
| `AMAZON_IT` | 3 | SP-API — solo aggiornamento, no creazione |
| `LEROY_MERLIN` | 4 | API dedicata |
| `BRICOBRAVO` | 5 | CSV feed via nginx — spec: [bricobravo.md](bricobravo.md) |
| `FATELLI_CATERINA` | 6 | VirtueMart — solo prodotti TAXI |

```java
public enum MarketplaceCode {
    BRICOBRICO(1),
    MANOMANO_IT(2),
    AMAZON_IT(3),
    LEROY_MERLIN(4),
    BRICOBRAVO(5),
    FATELLI_CATERINA(6);

    private final int id;

    MarketplaceCode(int id) { this.id = id; }
    public int getId() { return id; }

    public static MarketplaceCode fromCode(String code) {
        return Arrays.stream(values())
            .filter(m -> m.name().equalsIgnoreCase(code))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown marketplace: " + code));
    }
}
```

---

## Tabella `marketplaces`

| Colonna | Tipo | Vincoli | Note |
|---|---|---|---|
| `id` | BIGINT | PK | ID fisso — coincide con `MarketplaceCode.id` |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Valore enum `MarketplaceCode` |
| `name` | VARCHAR(100) | NOT NULL | Nome leggibile |
| `enabled` | BOOLEAN | NOT NULL, default `true` | Se `false`: escluso da sync e da nuove pubblicazioni |
| `sequence` | INTEGER | NOT NULL, default 0, ≥ 0 | Ordine visualizzazione |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | Aggiornato da trigger |

**Dati iniziali:**

| id | code | name | sequence |
|---|---|---|---|
| 1 | BRICOBRICO | BricoBrico | 10 |
| 2 | MANOMANO_IT | ManoMano IT | 20 |
| 3 | AMAZON_IT | Amazon IT | 30 |
| 4 | LEROY_MERLIN | Leroy Merlin | 40 |
| 5 | BRICOBRAVO | BricoBravo | 50 |
| 6 | FATELLI_CATERINA | Fatelli Caterina | 100 |

> Gli ID della tabella sono fissi e non generati da sequence: vengono inseriti esplicitamente nell'initial data. Aggiungere un nuovo marketplace richiede di assegnare un ID progressivo e aggiungere il valore all'enum.

---

## Riferimenti

| Contenuto | Documento |
|---|---|
| Modello dati `product_marketplaces` | [product-marketplaces.md](product-marketplaces.md) |
| Price Rule Engine | [price-engine.md](price-engine.md) |
| Sync Engine | [sync-engine.md](sync-engine.md) |
| Publication Engine | [publication-engine.md](publication-engine.md) |
| BricoBravo — integrazione completa | [bricobravo.md](bricobravo.md) |
| Strategic overview | [../../strategic-blueprint.md](../../strategic-blueprint.md) |
