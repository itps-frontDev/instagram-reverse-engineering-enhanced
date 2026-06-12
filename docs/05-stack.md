# 05 — Stack Tecnologico

[← Torna all'indice](../README.md)

---

## Backend

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Runtime** | Java | 21.0.11 LTS | Linguaggio backend |
| **Framework** | Spring Boot | 3.4.5 | Application framework (`core` + `directs-service`) |
| **Cloud** | Spring Cloud | 2024.0.1 | Eureka, Config Server, Gateway |
| **Build** | Gradle | 9.4.1 | Build tool multi-project |
| **ORM** | Spring Data JPA / Hibernate | 3.4.5 / 6.6.13 | Persistenza relazionale |
| **Sicurezza** | Spring Security | 6.4.5 | Filtri HTTP e autorizzazione |
| **JWT** | JJWT | 0.12.6 | Generazione e validazione token |
| **WebSocket** | Spring WebSocket + STOMP | 6.2.6 (Spring Framework) | Messaggistica real-time (`directs-service`) |
| **Auth token store** | Spring Data Redis | 3.4.5 | Refresh token, blacklist access token, sessioni utente |
| **DB Migration** | Liquibase | 4.29.2 | Versionamento schema |
| **Storage** | Azure Spring Cloud Blob | 5.24.0 | Upload media su Azure Blob Storage |
| **Utility** | Lombok | 1.18.38 | Riduzione boilerplate Java |

---

## Frontend

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | 22.21.1 | Runtime JavaScript |
| **Package manager** | pnpm | 11.5.2 | Gestione dipendenze |
| **Framework** | Next.js | 16.2.6 | UI, App Router, Server Components |
| **UI library** | React | 19.2.6 | Rendering componenti |
| **Linguaggio** | TypeScript | 5.9.3 | Type safety |
| **Styling** | Tailwind CSS | 4.2.4 | Utility-first CSS |
| **WebSocket** | @stomp/stompjs | 7.3.0 | Client STOMP per i Direct |
| **WebSocket fallback** | sockjs-client | 1.6.1 | Fallback HTTP per ambienti senza WebSocket nativo |
| **Validazione** | Zod | 3.25.76 | Schema validation lato client |

---

## Infrastruttura

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | 16 | Persistenza relazionale |
| **Token store** | Redis | 7 | Refresh token, blacklist e sessioni utente |
| **Container** | Docker | — | Containerizzazione servizi |
| **Orchestrazione** | Docker Compose | — | Avvio e gestione multi-container |
| **Discovery** | Eureka (Spring Cloud Netflix) | 2024.0.1 | Service registry e load balancing |
| **Gateway** | Spring Cloud Gateway | 2024.0.1 | Reverse proxy + routing |
| **Config** | Spring Cloud Config Server | 2024.0.1 | Configurazione centralizzata |

---

## Confronto con il sistema originale

| Aspetto | Monolite Next.js | Sistema Attuale |
| :--- | :--- | :--- |
| **Architettura** | Full-stack monolite (FE + BE nello stesso progetto Next.js) | Frontend Next.js separato che chiama un backend Spring Boot (core monolite + microservizio directs) |
| **Backend** | Next.js API Routes (Node.js) | Spring Boot 3.4.5 (Java 21.0.11) |
| **Database** | SQLite3 embedded | PostgreSQL 16 esternato |
| **Schema versioning** | Assente | Liquibase 4.29.2 con changeset XML |
| **Token store** | Assente | Redis 7 (refresh token, blacklist, sessioni) |
| **Messaggistica** | HTTP Polling | WebSocket STOMP bidirezionale |
| **Service Discovery** | Assente | Eureka (Spring Cloud) |
| **Config centralizzata** | Assente | Spring Cloud Config Server |
| **API Gateway** | Assente | Spring Cloud Gateway |
| **Storage media** | File system locale | Azure Blob Storage |
| **Containerizzazione** | Assente | Docker Compose completo |

---

[← Evoluzione per Componente](04-evoluzione.md) | [Funzionalità del Sistema →](06-funzionalita.md)
