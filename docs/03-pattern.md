# 03 — Pattern Architetturali Applicati

[← Torna all'indice](../README.md)

---

## Strangler Fig Pattern

La migrazione dal monolite Next.js a Spring Boot ha seguito lo **Strangler Fig Pattern**, introdotto da Martin Fowler. Il principio è di non riscrivere il sistema dall'inizio, ma affiancare progressivamente la nuova architettura a quella esistente, sostituendo una funzionalità alla volta.

In pratica, per ogni funzionalità il ciclo è stato:

1. Creazione del controller, service e repository corrispondente su Spring Boot.
2. Test dell'endpoint con **Postman**, verificando request/response prima di toccare il frontend.
3. Aggiornamento del frontend Next.js per puntare al nuovo endpoint Spring Boot.
4. Rimozione della vecchia API route di Next.js, ormai sostituita.

Il sistema rimaneva funzionante ad ogni iterazione: il frontend continuava a usare le route Next.js non ancora migrate, mentre quelle già migrate chiamavano il backend Spring Boot. Questo ha permesso di procedere funzionalità per funzionalità senza interruzioni.

Una volta completata la migrazione di tutte le rotte, il frontend Next.js è stato ripulito di tutto il codice che non gli apparteneva:

- **Repository** — le classi che interrogavano direttamente SQLite sono state rimosse interamente.
- **Connessione al database** — eliminata la dipendenza da `sqlite3` e la configurazione della connessione locale.
- **Server Actions con logica di business** — le action che contenevano logica applicativa (validazioni, trasformazioni dati, query complesse) sono state rimosse. Il frontend ora delega tutto al backend tramite semplici chiamate HTTP.
- **Seed e migration scripts** — rimossi gli script di inizializzazione del database SQLite (`db:migrate`, `db:seed`), ora gestiti da Liquibase sul backend.

Il risultato è un frontend **esclusivamente UI**: nessuna conoscenza del database, nessuna logica di business, nessuna dipendenza diretta ai dati. Ogni interazione passa per le API REST del backend Spring Boot tramite il gateway.

---

## MVC (Model-View-Controller)

Il backend Spring Boot è organizzato secondo il pattern **MVC**. Ogni dominio funzionale (`posts`, `profiles`, `likes`, ecc.) è strutturato in tre livelli chiaramente separati:

- **Controller** — espone gli endpoint REST, riceve le richieste HTTP e delega al service. Non contiene logica di business.
- **Service** — contiene tutta la logica di business e orchestra le operazioni sui repository.
- **Repository** — strato di accesso al dato via Spring Data JPA. Nessun controller accede direttamente al database.

---

## Repository Pattern

La separazione tra data access layer e business logic è garantita dal **Repository Pattern**, implementato tramite `JpaRepository` di Spring Data. Ogni entità ha il proprio repository, e il service layer è l'unico autorizzato a usarlo.

---

## Strategy Pattern

Il **Strategy Pattern** è applicato in tre aree:

### Likes

Il comportamento del "like" varia in base al tipo di contenuto (post, reel, commento). Un'interfaccia `LikeStrategy` definisce il contratto, con implementazioni distinte per ciascun tipo. La strategia corretta viene selezionata a runtime in base al contesto, senza `if/else` nel service.

```
LikeStrategy
  ├── PostLikeStrategy
  ├── ReelLikeStrategy
  └── CommentLikeStrategy
```

### Notifiche

Il sistema di notifiche combina Strategy Pattern, Registry e listener per eventi Spring. Ogni `NotificationStrategy` dichiara il `NotificationType` supportato e implementa `validate()` e `build()`. Il `NotificationStrategyRegistry` le indicizza in una `EnumMap` e risolve la strategia corretta a runtime. I listener sono separati per sottodominio, ciascuno in ascolto del proprio `ApplicationEvent`:

| Sottodominio | Casi coperti |
| :--- | :--- |
| **Follow** | nuovo follow, richiesta follow (profili privati), accettazione, rimozione |
| **Like** | like su post, su commento, su storia; rimozione like |
| **Commento** | nuovo commento, risposta a commento |
| **Menzione** | menzione in post, in commento, in storia |
| **Altro** | tag in post, visualizzazione storia, messaggio diretto |

### Accesso ai media

Il controllo di accesso ai media è gestito tramite una `MediaAccessStrategy` per categoria (`PostMediaAccessStrategy`, `StoryMediaAccessStrategy`, `ProfileMediaAccessStrategy`, `MessageMediaAccessStrategy`). Prima di servire un file, il sistema seleziona la strategia corrispondente alla categoria richiesta e verifica se l'utente corrente è autorizzato ad accedervi, sollevando `401`, `403`, `404` o `410` a seconda del caso.

Lo storage è sempre **Azure Blob Storage**, con un'unica implementazione `AzureBlobStorageService`. In sviluppo viene usato **Azurite** come emulatore locale, configurato tramite `docker-compose.override.yml` con una connection string dedicata — nessuna variazione nel codice Java.

---

## Event-Driven con Spring Application Events

Le **notifiche** sono gestite tramite un sistema a eventi interno alla JVM del modulo `core`. Quando si verifica un'azione rilevante, il service pubblica un `ApplicationEvent` Spring tramite `ApplicationEventPublisher`. Un `@EventListener` intercetta l'evento in modo asincrono e genera la notifica corrispondente.

```
LikeService.like()
  └── publisher.publishEvent(new LikeCreatedEvent(...))
        └── NotificationEventListener.onLike()
              └── NotificationStrategy.create()
```

> **Perché non un message broker?**
> Questo pattern funziona perché tutto il dominio principale risiede su una singola JVM. Estrarre le notifiche in un microservizio separato avrebbe richiesto Kafka o RabbitMQ per distribuire gli eventi tra JVM diverse — complessità infrastrutturale non giustificata dalla dimensione del progetto.

---

## WebSocket STOMP per i Direct Messages

Il sistema di messaggistica diretta è passato dal polling HTTP a un canale **WebSocket bidirezionale con protocollo STOMP**, gestito interamente nel `directs-service`.

### Flusso di connessione

```
1. Client → SockJS CONNECT ws://localhost:8080/ws
2. Gateway → instrada a directs-service:8082/ws
3. WebSocketAuthChannelInterceptor → valida JWT nel frame STOMP CONNECT
4. Client → STOMP SUBSCRIBE /user/queue/messages
5. Client → STOMP SEND /app/chat.send { chatId, content }
6. DirectWebSocketController → persiste il messaggio su DB
7. Server → STOMP MESSAGE /user/{recipientId}/queue/messages
8. Destinatario → riceve in tempo reale
```

### Configurazione STOMP

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // Endpoint SockJS:             /ws
    // Simple broker:               /queue, /topic
    // Application prefix:          /app
    // User destination prefix:     /user
}
```

L'autenticazione è gestita da un `ChannelInterceptor` dedicato che intercetta il frame `CONNECT` e blocca la connessione se il token JWT non è valido, prima ancora che il client possa sottoscrivere canali o inviare messaggi.

---

→ Continua: [Evoluzione per Componente](04-evoluzione.md)
