# 02 — Architettura Finale del Sistema

[← Torna all'indice](../README.md)

---

## Diagramma del sistema

```
  ┌─────────────────── AVVIO (prima delle richieste) ──────────────────────┐
  │                                                                         │
  │   ┌─────────────────────┐       ┌─────────────────────┐                │
  │   │   CONFIG SERVER     │       │  SERVICE DISCOVERY  │                │
  │   │  (Spring Cloud)     │       │  (Eureka Server)    │                │
  │   │   porta 8888        │       │   porta 8761        │                │
  │   │                     │       │                     │                │
  │   │  Serve properties   │       │  Registro centrale  │                │
  │   │  a tutti i moduli   │       │  dei microservizi   │                │
  │   └─────────┬───────────┘       └──────────┬──────────┘                │
  │             │ legge config al bootstrap     │ si registrano all'avvio  │
  │             ▼                               ▼                           │
  │        (tutti i servizi Spring Boot leggono config e si registrano)     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────── RUNTIME (path delle richieste) ─────────────────────┐
  │                                                                         │
  │                ┌─────────────────────────────────────┐                 │
  │                │           FRONTEND (Next.js)        │                 │
  │                │           porta 3000                │                 │
  │                └──────────────────┬──────────────────┘                 │
  │                                   │ HTTP REST + WebSocket (STOMP)      │
  │                                   ▼                                    │
  │                ┌─────────────────────────────────────┐                 │
  │                │         API GATEWAY                 │                 │
  │                │    (Spring Cloud Gateway)           │                 │
  │                │    porta 8080 — risolve i servizi   │                 │
  │                │    tramite Eureka                   │                 │
  │                └────────────┬──────────┬────────────┘                 │
  │           /api/** (REST)    │          │  /ws/** (WebSocket)           │
  │                             │          │                               │
  │        ┌────────────────────┘          └─────────────────────┐        │
  │        ▼                                                      ▼        │
  │ ┌──────────────────┐                          ┌──────────────────────┐ │
  │ │  CORE            │                          │  DIRECTS SERVICE     │ │
  │ │  Spring Boot MVC │                          │  Spring Boot WS      │ │
  │ │  porta 8081      │                          │  porta 8082          │ │
  │ │                  │                          │                      │ │
  │ │  Auth, Posts,    │                          │  Chat, Messaggi,     │ │
  │ │  Feed, Stories,  │                          │  WebSocket STOMP     │ │
  │ │  Reels, Likes,   │                          │                      │ │
  │ │  Follow, Profili,│                          │                      │ │
  │ │  Notifiche,      │    ┌──────────────────┐  │                      │ │
  │ │  Esplora, Search │    │  PostgreSQL 16   │  │                      │ │
  │ │  Media           │───►│  porta 5432      │◄─│                      │ │
  │ └──────────────────┘    │                  │  └──────────────────────┘ │
  │                         └──────────────────┘                           │
  │                         ┌──────────────────┐                           │
  │                         │    Redis 7        │                           │
  │                         │    porta 6379     │                           │
  │                         │  Token JWT e      │                           │
  │                         │  sessioni         │                           │
  │                         └──────────────────┘                           │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Flusso delle richieste

Tutte le richieste dal frontend transitano per l'**API Gateway** (porta 8080), unico punto di ingresso del sistema. Il gateway risolve i servizi tramite Eureka e applica il routing in base al path:

| Path | Destinazione | Protocollo |
| :--- | :--- | :--- |
| `/ws/**` | `directs-service` | WebSocket (STOMP) |
| `/api/priv/direct/**` | `directs-service` | HTTP REST |
| `/**` | `core` | HTTP REST |

Il frontend non conosce porte o indirizzi interni — chiama sempre e solo `localhost:8080`.

---

## Componenti

### Core (porta 8081)

Monolite Spring Boot che gestisce la quasi totalità del dominio applicativo: autenticazione JWT, post, feed, storie, reels, commenti, likes, follow, profili, esplora, ricerca e media. Le notifiche sono gestite tramite `ApplicationEvent` Spring, che funzionano all'interno della stessa JVM senza bisogno di un message broker esterno.

### Directs Service (porta 8082)

Microservizio isolato che gestisce la messaggistica diretta in tempo reale tramite WebSocket STOMP. Condivide lo stesso database PostgreSQL del core ma gestisce le proprie tabelle (`chat`, `messages`, `chat_participants`) tramite Liquibase migrations autonome.

### Service Discovery — Eureka (porta 8761)

Registry centrale. Tutti i servizi si registrano all'avvio con il proprio nome logico (es. `core`, `directs-service`). Il gateway usa questi nomi per il routing con load balancing (`lb://core`).

### Config Server (porta 8888)

Serve le configurazioni centralizzate a tutti i moduli. Ogni servizio legge le proprie properties al bootstrap, eliminando la duplicazione di configurazione tra i moduli.

### API Gateway (porta 8080)

Basato su Spring Cloud Gateway (Reactor WebFlux, non MVC). Applica le regole di routing definite nel Config Server e instrada le richieste ai servizi upstream tramite Eureka.

---

## Struttura directory del progetto

```text
instagram-reverse-engineering-enhanced/
│
├── 📂 backend/                                # Gradle multi-project
│   ├── settings.gradle                        # Dichiara i 5 moduli
│   ├── build.gradle                           # Root: Spring Boot 3.4.5, Spring Cloud 2024.0.1
│   │
│   ├── 📂 core/                               # Monolite Spring Boot (porta 8081)
│   │   └── src/main/
│   │       ├── java/it/evodev/instagram/
│   │       │   ├── auth/                      # JWT, login, register, filtri sicurezza
│   │       │   ├── common/                    # DTO e utility condivise tra moduli
│   │       │   ├── config/                    # Configurazione Spring (CORS, Security)
│   │       │   ├── posts/                     # Post CRUD
│   │       │   ├── feed/                      # Home feed
│   │       │   ├── stories/                   # Storie con scadenza
│   │       │   ├── reels/                     # Video brevi
│   │       │   ├── comments/
│   │       │   │   └── events/                # CommentCreatedEvent
│   │       │   ├── likes/
│   │       │   │   ├── events/                # LikeCreatedEvent, LikeRemovedEvent
│   │       │   │   └── strategies/            # PostLike, CommentLike, StoryLike
│   │       │   ├── follow/
│   │       │   │   └── events/                # FollowCreated/Requested/Accepted/Removed
│   │       │   ├── notifications/
│   │       │   │   ├── listeners/             # Un listener per sottodominio
│   │       │   │   └── strategies/            # Una strategy per NotificationType
│   │       │   ├── explore/
│   │       │   ├── search/
│   │       │   ├── profile/
│   │       │   │   └── picture/               # Upload e gestione immagine profilo
│   │       │   ├── media/                     # Streaming media + MediaAccessStrategy
│   │       │   └── redis/                     # RedisService, AuthRedisService
│   │       └── resources/
│   │           ├── application.properties
│   │           └── db/changelog/              # Liquibase migrations
│   │               ├── db.changelog-master.yaml
│   │               └── migrations/            # Un file XML per ogni entità
│   │
│   ├── 📂 directs-service/                    # Microservizio messaggistica (porta 8082)
│   │   └── src/main/
│   │       ├── java/it/evodev/directs/
│   │       │   ├── auth/                      # JWT parsing e validazione
│   │       │   ├── config/                    # WebSocketConfig (STOMP)
│   │       │   ├── controllers/               # REST + WebSocket handlers
│   │       │   ├── dto/                       # Request e Response DTO
│   │       │   ├── exceptions/
│   │       │   ├── models/                    # Chat, Message, ChatParticipant
│   │       │   ├── repositories/
│   │       │   ├── services/
│   │       │   └── util/
│   │       └── resources/
│   │           ├── application.properties
│   │           └── db/changelog/              # Migrazioni autonome (chat tables)
│   │
│   ├── 📂 service-discovery/                  # Eureka Server (porta 8761)
│   │
│   ├── 📂 config-server/                      # Config centralizzato (porta 8888)
│   │   └── src/main/resources/config/
│   │       ├── core.properties
│   │       ├── directs-service.properties
│   │       └── api-gateway.properties
│   │
│   └── 📂 api-gateway/                        # Spring Cloud Gateway (porta 8080)
│
├── 📂 frontend/                               # Next.js 16 (solo UI)
│   └── src/
│       ├── app/                               # App Router — pagine e route
│       │   ├── (auth)/                        # Login, Register
│       │   ├── (main)/                        # Pagine autenticate
│       │   │   ├── (profile)/                 # Profilo e impostazioni account
│       │   │   ├── direct/                    # Messaggi diretti
│       │   │   ├── explore/                   # Esplora
│       │   │   ├── p/[postId]/                # Dettaglio post
│       │   │   └── reels/                     # Reels
│       │   └── api/media/[...path]/           # Reverse proxy media → Spring Boot
│       ├── components/                        # Componenti React riutilizzabili
│       │   ├── common/                        # Elementi condivisi (skeletons, ecc.)
│       │   ├── feed/
│       │   ├── explore/
│       │   ├── direct/
│       │   ├── profile/
│       │   ├── layout/                        # Sidebar, navbar
│       │   └── ui/                            # Elementi base UI
│       ├── features/                          # Logica per dominio (actions, hooks)
│       │   ├── auth/
│       │   ├── posts/
│       │   ├── feed/
│       │   ├── stories/
│       │   ├── reels/
│       │   ├── comments/
│       │   ├── likes/
│       │   ├── follow/
│       │   ├── notifications/
│       │   ├── search/
│       │   ├── explore/
│       │   ├── profile/
│       │   └── directs/                       # Hook WebSocket STOMP
│       ├── lib/                               # Utility condivise, client auth
│       ├── contexts/                          # React Context providers
│       └── types/                             # TypeScript interfaces
│
└── 📄 docker-compose.yml
```

---

[← Stato Iniziale](01-stato-iniziale.md) | [Pattern Architetturali →](03-pattern.md)
