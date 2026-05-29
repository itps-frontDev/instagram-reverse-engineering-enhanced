# 06 — Funzionalità del Sistema

[← Torna all'indice](../README.md)

---

## Autenticazione e Profili

- **Registrazione e Login** — JWT stateless generato dal backend Spring Boot. Il `SecurityFilterChain` valida il token su ogni richiesta prima che raggiunga qualsiasi controller.
- **Profilo utente** — visualizzazione e modifica di avatar, bio e informazioni personali.
- **Follow/Unfollow** — sistema di follow con contatori di follower/following aggiornati in tempo reale.
- **Ricerca utenti** — ricerca per username con risultati paginati.

---

## Contenuti

- **Post** — creazione con immagini multiple, caption e tag utente. Visibilità configurabile (pubblico/privato).
- **Storie** — contenuti effimeri con scadenza automatica.
- **Reels** — video brevi con visualizzazione a scroll verticale.
- **Commenti** — sui post, con reply annidate.
- **Likes** — su post, reels e commenti, gestiti tramite [Strategy Pattern](03-pattern.md#strategy-pattern).
- **Salvataggio post** — raccolta personale di post salvati.

---

## Feed e Scoperta

- **Home Feed** — post degli utenti seguiti, ordinati per recenza. Il feed è cachato su Redis per ridurre il carico sul database nelle letture ripetute.
- **Esplora** — contenuti pubblici di utenti non ancora seguiti.
- **Ricerca** — ricerca full-text su post e utenti.

---

## Messaggistica Diretta

Gestita interamente dal `directs-service`. Vedi [Evoluzione dei Direct](04-evoluzione.md#direct-messages-da-polling-http-a-websocket-stomp) per i dettagli sull'architettura.

- **Chat 1:1** — creazione e gestione di conversazioni private.
- **WebSocket STOMP** — messaggi in tempo reale, senza polling.
- **Autenticazione del canale** — il JWT è validato al frame STOMP `CONNECT`, prima che il client possa iscriversi a qualsiasi canale.
- **Storico messaggi** — persistito su PostgreSQL, recuperabile via REST all'apertura della chat.

---

## Notifiche

Gestite tramite [Spring Application Events](03-pattern.md#event-driven-con-spring-application-events).

- **Like su post** — notifica al proprietario del post quando qualcuno mette like.
- **Nuovo commento** — notifica all'autore del post.
- **Nuovo follower** — notifica all'utente seguito.
- **Tag in un post** — notifica all'utente taggato.
- **Recupero** — le notifiche sono marcabili come lette tramite REST.

---

## Scenari d'Uso Principali

### Autenticazione

1. L'utente si registra fornendo username, email e password.
2. Il backend genera un JWT firmato e lo restituisce al client.
3. Il frontend include il token nell'header `Authorization: Bearer <token>` di ogni richiesta.
4. Il `SecurityFilterChain` valida la firma e la scadenza del token prima di raggiungere qualsiasi controller.

### Pubblicazione di un Post

1. L'utente seleziona le immagini dal dispositivo.
2. Il frontend invia i file all'endpoint di upload.
3. Il backend carica i file su **Azure Blob Storage** tramite la `MediaStrategy` e restituisce gli URL pubblici.
4. L'utente completa caption, tag e visibilità, e invia il post.
5. Il backend persiste il post su PostgreSQL e pubblica un `PostCreatedEvent`.
6. Gli utenti taggati ricevono una notifica generata dall'`@EventListener`.

### Invio di un Messaggio Diretto

1. Il client apre la pagina dei Direct. Il frontend stabilisce una connessione WebSocket a `ws://localhost:8080/ws`.
2. Il gateway instrada la connessione al `directs-service`.
3. Il `WebSocketAuthChannelInterceptor` verifica il JWT nel frame STOMP `CONNECT`. Connessione rifiutata se il token non è valido.
4. Il client si iscrive al canale `/user/queue/messages`.
5. L'utente invia un messaggio: `STOMP SEND /app/chat.send { chatId, content }`.
6. Il controller persiste il messaggio e lo instrada al destinatario su `/user/{id}/queue/messages`.
7. Il destinatario riceve il messaggio in tempo reale.

### Ricezione di una Notifica

1. Un utente mette like a un post.
2. Il `LikeService` completa l'operazione e pubblica un `LikeCreatedEvent`.
3. Il `NotificationEventListener` intercetta l'evento e invoca la `NotificationStrategy` corrispondente.
4. La strategia crea il record di notifica su PostgreSQL.
5. Il proprietario del post recupera la notifica non letta tramite REST.

---

→ Continua: [Guida all'Installazione](07-installazione.md)
