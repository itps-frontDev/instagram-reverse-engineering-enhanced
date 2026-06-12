# 04 — Evoluzione per Componente

[← Torna all'indice](../README.md)

---

## Database: da SQLite a PostgreSQL con Liquibase

### Prima

SQLite3 embedded nel processo Node.js. Schema definito in modo imperativo nei file di seed, senza storia delle versioni. Qualsiasi modifica allo schema richiedeva un reset manuale del file database.

### Dopo

PostgreSQL 16 esternato in container Docker. Ogni modifica allo schema è tracciata come **changeset Liquibase** in file XML versionati e applicata automaticamente all'avvio.

Il master changelog del `core` include i changeset in ordine deterministico:

```
db/changelog/db.changelog-master.yaml
  ├── changelog-extensions.xml      # PostgreSQL extensions
  ├── changelog-users.xml
  ├── changelog-profiles.xml
  ├── changelog-follows.xml
  ├── changelog-posts.xml
  ├── changelog-post-media.xml
  ├── changelog-post-tags.xml
  ├── changelog-comments.xml
  ├── changelog-stories.xml
  ├── changelog-story-views.xml
  ├── changelog-saved-posts.xml
  ├── changelog-likes.xml
  ├── changelog-notifications.xml
  └── seed/changelog-dev-seed.xml   # Dati di test (context: dev)
```

Il `directs-service` gestisce autonomamente le proprie tabelle (`chat`, `messages`, `chat_participants`) tramite un master changelog separato, rispettando il principio di autonomia del microservizio.

---

## Direct Messages: da Polling HTTP a WebSocket STOMP

### Prima (monolite Next.js)

```
Client → GET /api/direct/messages?chatId=X → Server → SQLite
(ripetuto ogni N secondi)
```

Ogni polling apriva una nuova connessione HTTP, indipendentemente dal fatto che ci fossero nuovi messaggi. Latenza minima pari all'intervallo di polling.

### Dopo (directs-service)

```
Client → STOMP CONNECT /ws  ──► WebSocketAuthChannelInterceptor valida JWT
Client → STOMP SUBSCRIBE /user/queue/messages
Client → STOMP SEND /app/chat.send { chatId, content }
Server → STOMP MESSAGE /user/{recipientId}/queue/messages
```

Connessione persistente full-duplex. Il server invia il messaggio al destinatario nel momento esatto in cui viene ricevuto, senza polling e senza latenza artificiale.

---

## Estrazione del Microservizio Directs

Il `directs-service` è il primo — e unico — microservizio estratto dal monolite. La scelta è stata motivata da criteri oggettivi:

**Perché isolarlo:**
- Dominio chiaramente delimitato: non dipende da entità del `core` (post, storie, ecc.) e ha le proprie tabelle.
- Richiede un protocollo diverso (WebSocket), che sarebbe fuori posto in un servizio HTTP REST puro.
- Picchi di carico indipendenti: la messaggistica in tempo reale ha pattern di utilizzo diversi dal feed.

**Perché non estrarre tutto:**
- Post, storie, notifiche e follow sono fortemente interconnessi tramite `ApplicationEvent` Spring.
- Separarli avrebbe richiesto un message broker esterno (Kafka, RabbitMQ) per distribuire gli eventi tra JVM diverse — complessità non giustificata dalla dimensione del progetto.
- Il monolite `core` su una singola JVM può usare il message broker nativo di Spring, più semplice e senza overhead infrastrutturale.

---

## Infrastruttura Spring Cloud

L'introduzione dei microservizi ha richiesto tre componenti di supporto:

### Service Discovery — Eureka

Tutti i servizi si registrano all'avvio con il proprio nome logico. Il gateway risolve `lb://core` e `lb://directs-service` tramite Eureka, applicando il load balancing automatico senza configurazione manuale degli indirizzi IP.

### Config Server

Le properties di configurazione di ogni modulo (porta, datasource, Eureka URL, chiave JWT) sono centralizzate in tre file nel Config Server:

```
config-server/src/main/resources/config/
  ├── core.properties
  ├── directs-service.properties
  └── api-gateway.properties
```

Ogni servizio legge la propria configurazione al bootstrap, prima ancora di avviarsi. Questo elimina la duplicazione e garantisce un'unica sorgente di verità per tutte le impostazioni.

### API Gateway

Basato su Spring Cloud Gateway (Reactor WebFlux). Espone la porta 8080 come unico punto di ingresso per il frontend e instrada le richieste ai servizi interni in base al path, senza che il frontend debba conoscere la topologia interna. Il routing è definito nel Config Server e caricato dinamicamente.

---

[← Pattern Architetturali](03-pattern.md) | [Stack Tecnologico →](05-stack.md)
