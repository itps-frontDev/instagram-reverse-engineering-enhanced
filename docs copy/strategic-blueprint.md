# FatelliSync — Strategic Blueprint

**Tipo documento:** Strategic
**Versione:** 1.0
**Data:** 2026-05-04

---

## 1. Problema

FatelliSync è un **ERP Middleware** che funge da base dati centralizzata per prodotti, prezzi e giacenze, con sincronizzazione automatica verso i marketplace di vendita online.

**Contesto attuale (AS-IS):** La sincronizzazione di prezzi e giacenze verso i marketplace è delegata a Poleepo.cloud (€2.500/anno). Il tool è generico, non sfruttato appieno, e introduce un vincolo esterno su un processo che può essere controllato internamente.

**Obiettivo (TO-BE):** Eliminare Poleepo.cloud sostituendolo con un sistema interno costruito sulle esigenze specifiche dell'azienda, gestito dallo sviluppatore interno.

**Implementation Implication:** Il sistema deve replicare le funzionalità di sincronizzazione di Poleepo (prezzi, giacenze, anagrafica) su tutti i marketplace attivi, con il vantaggio di essere estendibile liberamente.

---

## 2. Metriche di successo

| Metrica | Target |
|---|---|
| Sincronizzazione prezzi autonoma | Attiva su tutti i marketplace MVP |
| Sincronizzazione giacenze autonoma | Attiva su tutti i marketplace MVP |
| Dipendenza da Poleepo.cloud | **Zero** — contratto non rinnovato |
| Intervento manuale per aggiornare prezzi/stock | **Zero** per i marketplace integrati |

**Implementation Implication:** Ogni modulo marketplace deve esporre metriche di esito sync (successi, fallimenti, timestamp ultimo run) visibili dall'interfaccia o dai log.

---

## 3. Vantaggio strategico

- **Costo**: €0 vs €2.500/anno → ROI dal primo giorno di go-live.
- **Flessibilità**: regole di pricing, mappature categorie e logiche di sync personalizzate per ogni marketplace, non vincolate a un tool generico.
- **Controllo**: tutto il dato prodotto risiede internamente; nessuna dipendenza da uptime di terze parti per operazioni critiche.
- **Scalabilità**: aggiungere nuovi marketplace o nuove sorgenti dati è un'estensione del sistema, non un cambio di piano tariffario.

---

## 4. Architettura (confermata)

| Layer | Tecnologia | Ruolo |
|---|---|---|
| Backend | Spring Boot 4 / Java 25 | Business logic, API REST |
| Frontend | Next.js (futuro) | Interfaccia operativa |
| Database | PostgreSQL | Fonte di verità per tutti i dati |
| Cache | Redis | Ottimizzazione query frequenti |
| Reverse proxy | Nginx + Let's Encrypt | SSL termination, routing |
| Container | Docker Compose | Deploy self-hosted |

**Implementation Implication:** Spring Boot espone API REST su HTTP (SSL su Nginx). Il frontend consuma le API tramite `/api`. Il deploy avviene su `hub.fatellicaterinasrl.com`.

Dettagli deploy → [Docker Spec Backend](docker-backend.md)

---

## 5. Stack (confermato)

Spring Boot 4 / Java 25 / PostgreSQL / Redis / Next.js / Docker.
Nessuna valutazione alternativa in corso.

---

## 6. Scope MVP

Il sistema è organizzato in **3 moduli core**.

### Modulo 1 — Prodotti (Core)

Gestione del catalogo prodotti con indicizzazione automatica da sorgenti eterogenee.

| Funzionalità | Descrizione |
|---|---|
| Indicizzazione automatica | Import periodico da TAXI, LELLO, C&C, CARMECCANICA |
| Upsert con campi protetti | Logica `@ManagedBy` per preservare modifiche manuali |
| Trigger manuale per sorgente | `POST /admin/indexing/{dataSource}` |
| Gestione sorgente MANUAL | Prodotti creati/modificati a mano, mai sovrascritti |

Spec di dettaglio → [Indicizzatore Prodotti](core/products/indexer.md)

---

### Modulo 2 — Marketplace

Gestione della relazione prodotto ↔ marketplace con calcolo prezzi e sincronizzazione verso gli store.

**Marketplace in scope MVP:**

| Marketplace | Tipo integrazione | Note |
|---|---|---|
| BricoBrico | WooCommerce REST API | Creazione + aggiornamento prodotti |
| ManoMano | API dedicata | Creazione + aggiornamento prodotti |
| Bricobravo | API dedicata | Creazione + aggiornamento prodotti |
| Amazon | API Amazon SP | **Solo aggiornamento** — no creazione prodotti |
| Leroy Merlin | API dedicata | Creazione + aggiornamento prodotti |
| Fatelli Caterina | VirtueMart | Solo prodotti TAXI |

**Funzionalità MVP:**

| Funzionalità | Descrizione |
|---|---|
| Associazione prodotto-marketplace | Relazione tra SKU interno e ID prodotto sul marketplace |
| Regola di prezzo per marketplace | Calcolo prezzo di vendita a partire dai listini TAXI |
| Sync prezzi | Push automatico del prezzo calcolato verso lo store |
| Sync giacenze | Push automatico della quantità disponibile verso lo store |
| Sync anagrafica | Push di nome, descrizione, immagini, categorie |
| Report sync | Esito per ogni run: successi, fallimenti, timestamp |

**Implementation Implication:** Il modulo marketplace dipende dal catalogo prodotti (Modulo 1) come fonte di verità. Nessun dato di prodotto viene gestito direttamente qui — solo mappatura e trasformazione verso l'API del marketplace.

Spec di dettaglio → [Marketplace Module](core/marketplace/marketplace.md)

---

### Modulo 3 — Ordini

Visualizzazione centralizzata degli ordini ricevuti dai marketplace con generazione PDF per la preparazione della merce.

| Funzionalità | Descrizione |
|---|---|
| Lista ordini | Aggregazione ordini da tutti i marketplace integrati |
| Dettaglio ordine | Righe, quantità, prezzi, stato, marketplace di origine |
| Download PDF | Documento di picking stampabile per preparare la spedizione |

**Implementation Implication:** Gli ordini sono in sola lettura rispetto ai marketplace (non si gestisce lo stato di spedizione da FatelliSync nella v1). Il PDF è generato server-side.

Spec di dettaglio → `specs/core/orders/` *(da creare)*

---

## 7. Fuori scope (v1)

| Funzionalità | Motivo esclusione |
|---|---|
| Contabilità analitica | Complessità non giustificata nella v1 |
| Dashboard / analytics | Rinviata a v2 |
| Creazione prodotti su Amazon | Processo troppo vincolato da Amazon; solo update |
| Gestione spedizioni e tracking | Fuori scope ordini v1 |
| Multi-tenant / multi-azienda | Sistema single-tenant per design |

---

## 8. Struttura documentazione specs

```
specs/
├── strategic-blueprint.md       ← questo file
├── docker-backend.md
└── core/
    ├── products/
    │   ├── indexer.md           ← specced ✅ (TAXI, LELLO, CARMECCANICA; C&C esclusa da MVP)
    │   └── images.md            ← specced ✅ (ImageService, ImageController, cache, content-addressing)
    ├── marketplace/
    │   ├── marketplace.md           ← overview + navigation ✅
    │   ├── product-marketplaces.md  ← modello dati ✅
    │   ├── price-engine.md          ← Price Rule Engine ✅
    │   ├── price-taxi.md            ← strategy TAXI ✅
    │   ├── sync-engine.md           ← Sync Engine ✅
    │   └── publication-engine.md    ← Publication Engine ✅
    └── orders/
        └── ...                  ← da speccare
```

---

## 9. Riferimenti

| Contenuto | Documento |
|---|---|
| Deploy Docker + Nginx | [docker-backend.md](docker-backend.md) |
| Indicizzatore prodotti | [core/products/indexer.md](core/products/indexer.md) |
| ImageService (processing, cache, CDN) | [core/products/images.md](core/products/images.md) |
| Spec marketplace | [core/marketplace/marketplace.md](core/marketplace/marketplace.md) |
| Spec ordini | `core/orders/` *(da creare)* |

*Questo documento è di tipo Strategic. Anti-pattern, test case ed error handling si trovano nei documenti di implementazione.*
