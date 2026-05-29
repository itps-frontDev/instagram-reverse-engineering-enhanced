# 05 — Stack Tecnologico

[← Torna all'indice](../README.md)

---

## Backend

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Runtime** | Java | 21 | Linguaggio backend |
| **Framework** | Spring Boot | 3.4.5 | Application framework (`core` + `directs-service`) |
| **Cloud** | Spring Cloud | 2024.0.1 | Eureka, Config Server, Gateway |
| **Build** | Gradle | 9.4.1 | Build tool multi-project |
| **ORM** | Spring Data JPA / Hibernate | (via Spring Boot BOM) | Persistenza relazionale |
| **Sicurezza** | Spring Security | (via Spring Boot BOM) | Filtri HTTP e autorizzazione |
| **JWT** | JJWT | 0.12.6 | Generazione e validazione token |
| **WebSocket** | Spring WebSocket + STOMP | (via Spring Boot BOM) | Messaggistica real-time (`directs-service`) |
| **Cache** | Spring Data Redis | (via Spring Boot BOM) | Caching feed e sessioni |
| **DB Migration** | Liquibase | (via Spring Boot BOM) | Versionamento schema |
| **Storage** | Azure Spring Cloud Blob | 5.24.0 | Upload media su Azure Blob Storage |
| **Utility** | Lombok | (via Spring Boot BOM) | Riduzione boilerplate Java |

---

## Frontend

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | v22 | Runtime JavaScript |
| **Package manager** | pnpm | 11.0.9 | Gestione dipendenze |
| **Framework** | Next.js | 16.2.6 | UI, App Router, Server Components |
| **UI library** | React | 19.2.6 | Rendering componenti |
| **Linguaggio** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **WebSocket** | @stomp/stompjs | 7.0.0 | Client STOMP per i Direct |
| **WebSocket fallback** | sockjs-client | 1.6.1 | Fallback HTTP per ambienti senza WebSocket nativo |

---

## Infrastruttura

| Componente | Tecnologia | Versione | Ruolo |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | 16 | Persistenza relazionale |
| **Cache** | Redis | 7 | Cache e sessioni |
| **Container** | Docker + Docker Compose | — | Orchestrazione servizi |
| **Discovery** | Eureka (Spring Cloud Netflix) | — | Service registry e load balancing |
| **Gateway** | Spring Cloud Gateway | — | Reverse proxy + routing |
| **Config** | Spring Cloud Config Server | — | Configurazione centralizzata |

---

## Confronto con il sistema originale

| Aspetto | Monolite Next.js | Sistema Attuale |
| :--- | :--- | :--- |
| **Architettura** | Full-stack monolite | Core monolite + microservizio directs |
| **Backend** | Next.js API Routes (Node.js) | Spring Boot 3.4.5 (Java 21) |
| **Database** | SQLite3 embedded | PostgreSQL 16 esternato |
| **Schema versioning** | Assente | Liquibase con changeset XML |
| **Cache** | Assente | Redis 7 |
| **Messaggistica** | HTTP Polling | WebSocket STOMP bidirezionale |
| **Service Discovery** | Assente | Eureka (Spring Cloud) |
| **Config centralizzata** | Assente | Spring Cloud Config Server |
| **API Gateway** | Assente | Spring Cloud Gateway |
| **Storage media** | File system locale | Azure Blob Storage |
| **Containerizzazione** | Assente | Docker Compose completo |

---

→ Continua: [Funzionalità del Sistema](06-funzionalita.md)
