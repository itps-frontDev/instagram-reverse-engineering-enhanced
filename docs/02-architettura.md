# 02 — Architettura Finale del Sistema

[← Torna all'indice](../README.md)

---

## Diagramma del sistema

```
                     ┌─────────────────────────────────────┐
                     │           FRONTEND (Next.js)        │
                     │           porta 3000                │
                     └──────────────────┬──────────────────┘
                                        │ HTTP REST + WebSocket (STOMP)
                                        ▼
                     ┌─────────────────────────────────────┐
                     │         API GATEWAY                 │
                     │    (Spring Cloud Gateway)           │
                     │           porta 8080                │
                     └────────────┬──────────┬────────────┘
                /api/** (REST)    │          │  /ws/** (WebSocket)
                                 │          │
           ┌─────────────────────┘          └──────────────────────┐
           ▼                                                        ▼
┌──────────────────────────┐                     ┌──────────────────────────┐
│  CORE (Spring Boot MVC)  │                     │  DIRECTS SERVICE         │
│       porta 8081         │                     │  (Spring Boot WebSocket) │
│                          │                     │       porta 8082         │
│  Auth, Posts, Feed,      │                     │                          │
│  Stories, Reels,         │                     │  Chat, Messaggi,         │
│  Notifiche, Profili,     │                     │  WebSocket STOMP,        │
│  Likes, Commenti,        │                     │  Auth JWT via            │
│  Follows, Esplora,       │                     │  ChannelInterceptor      │
│  Search, Media           │                     └────────────┬─────────────┘
└──────────────────────────┘                                  │
           │              ┌─────────────────────┐            │
           │              │  SERVICE DISCOVERY  │◄───────────┘
           └─────────────►│  (Eureka Server)    │
                          │       porta 8761    │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   CONFIG SERVER     │
                          │  (Spring Cloud      │
                          │   Config)           │
                          │     porta 8888      │
                          └─────────────────────┘

           ┌──────────────────────────────────────┐
           │       INFRASTRUTTURA DOCKER           │
           │                                       │
           │  PostgreSQL 16  │  Redis 7            │
           │  porta 5432     │  porta 6379         │
           └───────────────────────────────────────┘
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

Microservizio isolato che gestisce la messaggistica diretta in tempo reale tramite WebSocket STOMP. Ha il proprio database (tabelle `chat`, `messages`, `chat_participants`) e le proprie Liquibase migrations, indipendenti dal core.

### Service Discovery — Eureka (porta 8761)

Registry centrale. Tutti i servizi si registrano all'avvio con il proprio nome logico (es. `CORE`, `DIRECTS-SERVICE`). Il gateway usa questi nomi per il routing con load balancing (`lb://core`).

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
│   │       │   ├── auth/                      # JWT, login, register
│   │       │   ├── posts/                     # Post CRUD
│   │       │   ├── feed/                      # Home feed
│   │       │   ├── stories/
│   │       │   ├── reels/
│   │       │   ├── comments/
│   │       │   ├── likes/                     # Strategy Pattern
│   │       │   ├── follow/
│   │       │   ├── notifications/             # Event-driven (ApplicationEvent)
│   │       │   ├── explore/
│   │       │   ├── search/
│   │       │   ├── profile/
│   │       │   ├── media/                     # Azure Blob Storage (Strategy)
│   │       │   └── redis/                     # Caching annotations
│   │       └── resources/
│   │           ├── application.properties
│   │           └── db/changelog/              # Liquibase migrations
│   │               ├── db.changelog-master.yaml
│   │               └── migrations/            # Un file XML per ogni entità
│   │
│   ├── 📂 directs-service/                    # Microservizio messaggistica (porta 8082)
│   │   └── src/main/
│   │       ├── java/it/evodev/directs/
│   │       │   ├── auth/                      # JWT parsing
│   │       │   ├── config/                    # WebSocketConfig (STOMP)
│   │       │   ├── controllers/               # REST + WebSocket handlers
│   │       │   ├── models/                    # Chat, Message, ChatParticipant
│   │       │   ├── repositories/
│   │       │   └── services/
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
│       ├── app/
│       ├── components/
│       ├── features/
│       │   └── directs/                       # Hook WebSocket STOMP
│       └── lib/                               # Client STOMP + SockJS
│
└── 📄 docker-compose.yml
```

---

→ Continua: [Evoluzione per Componente](04-evoluzione.md)
