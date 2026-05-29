# 03 — Pattern Architetturali Applicati

[← Torna all'indice](../README.md)

---

## Strangler Fig Pattern

La migrazione dal monolite Next.js a Spring Boot ha seguito lo **Strangler Fig Pattern**, introdotto da Martin Fowler. Il principio è di non riscrivere il sistema dall'inizio, ma affiancare progressivamente la nuova architettura a quella esistente, sostituendo una funzionalità alla volta.

In pratica:

1. Il backend Spring Boot è stato costruito **in parallelo** al monolite Next.js, senza toccare il sistema esistente.
2. Le rotte di Next.js sono state migrate **una per una** verso i controller Spring Boot.
3. Il frontend è stato aggiornato progressivamente per puntare al nuovo backend.
4. Al termine della migrazione, le API routes di Next.js sono state rimosse.

Questo approccio ha garantito continuità operativa durante l'intera transizione, con la possibilità di rollback parziale su ogni singola feature.

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

La generazione della notifica dipende dal tipo di evento che la ha scatenata. Una `NotificationStrategy` per tipo (follow, like, commento, tag) viene selezionata e invocata dall'event listener.

### Storage media

L'upload dei media è astratto dietro una strategy, che può puntare ad Azure Blob Storage o al filesystem locale in base alla configurazione dell'ambiente.

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
