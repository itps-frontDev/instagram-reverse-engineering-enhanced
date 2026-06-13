# Instagram Clone — Evoluzione Architetturale

> Da un prototipo **Next.js full-stack** a un sistema distribuito con **Spring Boot**, microservizi e **WebSocket STOMP**.

![Java](https://img.shields.io/badge/Java-21.0.11-orange) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.5-green) ![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-2024.0.1-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Redis](https://img.shields.io/badge/Redis-7-red) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

---

Il progetto documenta la trasformazione completa di un'applicazione Instagram-like partita come monolite Node.js con SQLite fino ad un'architettura a microservizi con Spring Cloud, WebSocket STOMP e versionamento del database tramite Liquibase.

La migrazione ha seguito lo **Strangler Fig Pattern**: nessun big-bang rewrite, ma sostituzione incrementale delle funzionalità una alla volta, mantenendo il sistema operativo durante tutta la transizione.

---

## Documentazione

| # | Argomento | Descrizione |
| :--- | :--- | :--- |
| 01 | [Stato Iniziale](docs/01-stato-iniziale.md) | Architettura del monolite Next.js, limiti e motivazioni del refactoring |
| 02 | [Architettura Finale](docs/02-architettura.md) | Diagramma del sistema, componenti, flusso delle richieste e struttura directory |
| 03 | [Pattern Architetturali](docs/03-pattern.md) | Strangler Fig, architettura a livelli, Repository, Strategy, Event-driven, WebSocket STOMP |
| 04 | [Evoluzione per Componente](docs/04-evoluzione.md) | Come ogni parte del sistema è cambiata: DB, Direct, microservizi, Spring Cloud |
| 05 | [Stack Tecnologico](docs/05-stack.md) | Tecnologie usate e confronto con il sistema originale |
| 06 | [Funzionalità](docs/06-funzionalita.md) | Feature del sistema e scenari d'uso principali |
| 07 | [Installazione](docs/07-installazione.md) | Guida all'avvio con Docker Compose: modalità sviluppo, produzione e demo online |
| 08 | [Troubleshooting](docs/08-troubleshooting.md) | Problemi comuni e soluzioni |
