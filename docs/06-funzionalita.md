# 06 — Funzionalità del Sistema

[← Torna all'indice](../README.md)

---

## Autenticazione e Profili

- **Registrazione e Login** — JWT stateless generato dal backend Spring Boot. Il `SecurityFilterChain` valida il token su ogni richiesta prima che raggiunga qualsiasi controller.
- **Profilo utente** — visualizzazione e modifica di avatar, bio e informazioni personali. Visibilità configurabile (pubblico/privato): i profili privati richiedono una richiesta di follow approvata per accedere ai contenuti.
- **Follow/Unfollow** — sistema di follow con contatori di follower/following aggiornati in tempo reale.
- **Ricerca utenti** — ricerca per username con risultati paginati.

---

## Contenuti

- **Post** — creazione con immagini multiple, caption e tag utente.
- **Storie** — contenuti effimeri con scadenza automatica.
- **Reels** — video brevi con visualizzazione a scroll verticale.
- **Commenti** — sui post, con reply annidate.
- **Likes** — su post, reels, storie e commenti, gestiti tramite [Strategy Pattern](03-pattern.md#strategy-pattern).
- **Salvataggio post** — raccolta personale di post salvati.

---

## Feed e Scoperta

- **Home Feed** — post degli utenti seguiti, ordinati per recenza.
- **Esplora** — post di profili pubblici (esclusi i propri), ordinati per engagement (likes e commenti).
- **Ricerca** — ricerca utenti per username o nome completo.

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

- **Like** — notifica al proprietario del post quando qualcuno mette like.
- **Commento** — notifica all'autore del post.
- **Follow** — notifica all'utente seguito (nuovo follower, richiesta follow su profilo privato, accettazione richiesta).
- **Recupero** — le notifiche sono recuperabili via REST e marcabili come lette.

---

## Scenari d'Uso

### Registrazione

1. L'utente inserisce email, username, password, nome completo (opzionale) e data di nascita.
2. Il backend crea l'utente e il profilo associato su PostgreSQL.
3. Vengono restituiti un access token JWT e un refresh token, quest'ultimo memorizzato su Redis.

### Login

1. L'utente inserisce un identificatore (username, email o numero di telefono) e la password.
2. Il backend verifica le credenziali e genera un access token JWT firmato e un refresh token.
3. Il frontend include l'access token nell'header `Authorization: Bearer <token>` di ogni richiesta successiva.
4. Il `SecurityFilterChain` valida la firma e la scadenza del token prima di raggiungere qualsiasi controller.

### Pubblicazione di un Post

1. L'utente seleziona le immagini dal dispositivo.
2. Il frontend invia i file all'endpoint di upload; il backend li carica su **Azure Blob Storage** tramite `AzureBlobStorageService`.
3. I media non vengono esposti direttamente con URL pubblici Azure: il frontend li serve tramite una **API route Next.js** (`/api/media/[...path]`) che agisce da reverse proxy autenticato verso il backend Spring Boot, il quale streamma il contenuto da Blob Storage.
4. L'utente completa la caption e invia il post.
5. Il backend persiste il post e i media associati su PostgreSQL.

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

[← Stack Tecnologico](05-stack.md) | [Installazione →](07-installazione.md)
