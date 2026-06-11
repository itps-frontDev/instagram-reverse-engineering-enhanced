# API Routes — Migration Status

[← Torna all'indice](../../README.md) | [Pattern Architetturali](../03-pattern.md)

---

Confronto tra le route legacy Next.js API Routes e gli endpoint Spring Boot attivi.  
Verificato sui controller sorgente Spring e sulle route del progetto legacy.

---

## Auth

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `POST /api/auth/login` | `POST /api/public/auth/login` | Login — restituisce access token + refresh token |
| `POST /api/auth/logout` | `POST /api/priv/auth/logout` | Logout — invalida il refresh token |
| `GET /api/auth/me` | `GET /api/priv/auth/me` | Info utente autenticato corrente |
| `POST /api/auth/register` | `POST /api/public/auth/register` | Registrazione utente + profilo in transazione |
| — | `POST /api/public/auth/refresh` | Rinnova i token via refresh token (nuovo in Spring) |

---

## Profili

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| — | `GET /api/priv/profiles/me` | Profilo dell'utente autenticato (nuovo in Spring) |
| `GET /api/profiles/[username]` | `GET /api/priv/profiles/{username}` | Profilo completo con flag contestuali e privacy |
| `GET /api/profiles/[username]/preview` | `GET /api/priv/profiles/{username}/preview` | Anteprima profilo per card hover |
| `GET /api/profiles/[username]/can-view` | `GET /api/priv/profiles/{username}/can-view` | Controllo accesso ai contenuti del profilo |
| `GET /api/profiles/[username]/posts` | `GET /api/priv/profiles/{username}/posts` | Tab posts/reels/saved/tagged con paginazione |
| `PUT /api/profiles/edit` | `PUT /api/priv/profiles/edit` | Aggiorna bio, website, genere |
| `PUT /api/profiles/personal` | `PUT /api/priv/profiles/personal` | Aggiorna username e nome con controllo unicità |
| `PUT /api/profiles/birthday` | `PUT /api/priv/profiles/birthday` | Aggiorna data di nascita (età minima 13 anni) |
| — | `GET /api/priv/profiles/birthday` | Legge data di nascita (nuovo in Spring) |
| `PUT /api/profiles/privacy` | `PUT /api/priv/profiles/privacy` | Aggiorna privacy e promuove follow request pendenti |
| `PUT /api/profiles/security` | `PUT /api/priv/profiles/security` | Aggiorna email, telefono, password (bcrypt) |
| — | `GET /api/priv/profiles/security` | Legge email e telefono (nuovo in Spring) |
| `POST /api/profiles/upload-image` | `PUT /api/priv/profiles/me/picture` | Upload foto profilo |
| `POST /api/profiles/[username]/upload-image` | `PUT /api/priv/profiles/me/picture` | Upload foto profilo (solo owner) |
| `DELETE /api/profiles/remove-image` | `DELETE /api/priv/profiles/me/picture` | Rimozione foto profilo |
| `POST /api/profiles/[username]/remove-image` | `DELETE /api/priv/profiles/me/picture` | Rimozione foto profilo (solo owner) |
| `GET /api/profiles/suggestions` | `GET /api/priv/follows/suggestions` | Top-20 profili pubblici non seguiti, shuffled |
| `GET /api/profiles/me/followers` | ~~rimossa~~ | **Deprecated** — usare `/api/priv/follows/{username}/followers` |

---

## Follow

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/profiles/[username]/follow-status` | `GET /api/priv/follows/{username}/status` | Stato relazione follow tra utente corrente e target |
| `GET /api/profiles/[username]/followers` | `GET /api/priv/follows/{username}/followers` | Lista followers con followStatus per item |
| `GET /api/profiles/[username]/following` | `GET /api/priv/follows/{username}/following` | Lista following con followStatus per item |
| `POST /api/profiles/actions/follow` | `POST /api/priv/follows/{targetProfileId}` | Toggle follow/unfollow/cancel con notifiche |
| `POST /api/profiles/actions/unfollow` | `POST /api/priv/follows/{targetProfileId}` | Unfollow via toggle endpoint |
| `POST /api/profiles/follow/accept` | `POST /api/priv/follows/requests/{requesterProfileId}/accept` | Accetta follow request; aggiorna contatori e notifica |
| `POST /api/profiles/follow/reject` | `POST /api/priv/follows/requests/{requesterProfileId}/reject` | Rifiuta follow request (status=rejected + soft delete) |
| `POST /api/profiles/actions/remove-follower` | `DELETE /api/priv/follows/followers/{followerProfileId}` | Rimuovi follower; aggiorna contatori |

---

## Post

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `POST /api/posts/create` | `POST /api/priv/posts` | Crea post multipart (immagini + caption/location); supporta JPEG PNG GIF WebP AVIF MP4 MOV WebM |
| `GET /api/posts/[postId]` | `GET /api/priv/posts/{postId}` | Fetch singolo post con tutti i media |
| `PATCH /api/posts/[postId]` | `PATCH /api/priv/posts/{postId}` | Aggiorna caption (solo owner) |
| `DELETE /api/posts/[postId]` | `DELETE /api/priv/posts/{postId}` | Elimina post (solo owner) |
| `GET /api/posts/[postId]/tags` | `GET /api/priv/posts/{postId}/tags` | Tag del post con username del profilo taggato |
| `POST /api/posts/[postId]/save` | `POST /api/priv/posts/{postId}/save-toggle` | Toggle save/unsave |
| `POST /api/posts/[postId]/unsave` | `POST /api/priv/posts/{postId}/save-toggle` | Unsave via toggle |
| `GET /api/posts/[postId]/is-saved` | ~~rimossa~~ | Stato save ora incluso nella risposta Spring |

---

## Commenti

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/feed/comments` | `GET /api/priv/comments` | Lista commenti (`?postId=`, `limit`, `offset`) |
| `POST /api/feed/comments` | `POST /api/priv/comments` | Creazione commento |
| `POST /api/posts/[postId]/comment` | `POST /api/priv/comments` | Creazione commento (unified) |
| `DELETE /api/feed/comments/[id]` | `DELETE /api/priv/comments/{commentId}` | Elimina commento (owner commento o owner post) |

---

## Likes

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `POST /api/posts/[postId]/like` | `POST /api/priv/likes/post/{id}` | Toggle like su post |
| `POST /api/posts/[postId]/unlike` | `POST /api/priv/likes/post/{id}` | Unlike via toggle |
| `GET /api/posts/[postId]/is-liked` | ~~rimossa~~ | Stato like ora incluso nella risposta Spring |
| `POST /api/feed/like` | `POST /api/priv/likes/post/{id}` | Toggle like dal feed |
| `POST /api/feed/comments/like` | `POST /api/priv/likes/comment/{id}` | Toggle like su commento |
| `POST /api/stories/[id]/like` | `POST /api/priv/likes/story/{id}` | Toggle like su story |

> Tutti convergono su `POST /api/priv/likes/{likeableType}/{likeableId}` — endpoint unificato Spring.

---

## Feed

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/feed` | `GET /api/priv/feed` | Home feed con paginazione `limit`/`offset`: post di chi segui + post di profili pubblici + ultimo post dell'utente corrente |
| `POST /api/feed/save` | `POST /api/priv/posts/{postId}/save-toggle` | Save dal feed |

---

## Stories

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/stories` | `GET /api/priv/stories` | Story feed attivo per l'utente autenticato |
| `POST /api/stories` | ~~non migrata~~ | Creazione story — **mancante in Spring** |
| `GET /api/stories/[id]/public` | `GET /api/priv/stories/profiles/{profileId}` | Story viewer per profilo |
| `POST /api/stories/[id]/view` | `POST /api/priv/stories/{storyId}/view` | Registra visualizzazione story (idempotente) |
| `GET /api/stories/[id]/viewers` | ~~non migrata~~ | Lista viewer della story — **mancante in Spring** |

---

## Reels ed Explore

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/reels` | `GET /api/priv/reels` | Reels feed (`limit`, `excludeIds`) |
| `GET /api/explore` | `GET /api/priv/explore` | Explore feed con post popolari da profili pubblici |

---

## Search

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/search` | `GET /api/priv/search` | Ricerca profili per username o nome (`type`, `limit`) |

---

## Notifiche

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/notifications` | `GET /api/priv/notifications` | Lista notifiche (`limit`, `cursor`) |
| `GET /api/notifications/unread-count` | `GET /api/priv/notifications/unread-count` | Conteggio notifiche non lette |
| `PATCH /api/notifications/mark-read` | `PATCH /api/priv/notifications/read-all` | Marca tutte le notifiche come lette |
| — | `PATCH /api/priv/notifications/{notificationUuid}/read` | Marca singola notifica come letta (nuovo in Spring) |
| — | `DELETE /api/priv/notifications/{notificationUuid}` | Elimina notifica (nuovo in Spring) |

---

## Direct Messages

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/direct/chats` | `GET /api/priv/direct/chats` | Lista chat con ultimo messaggio (LATERAL JOIN) + mutual followers senza chat |
| `GET /api/direct/messages` | `GET /api/priv/direct/messages?chatId=` | Ultimi 100 messaggi della chat (`ORDER BY created_at DESC, id DESC`) |
| `POST /api/direct/get-or-create` | `POST /api/priv/direct/get-or-create` | Get o crea chat 1-to-1 tra utente corrente e target |
| `POST /api/direct/send` | `POST /api/priv/direct/send` | Invia messaggio (controllo partecipanti + WebSocket broadcast dopo commit) |
| Polling su `GET /api/direct/messages` | Spring WebSocket STOMP | Real-time sostituito da STOMP: CONNECT con JWT → SUBSCRIBE `/user/queue/direct` → PUBLISH `/app/direct.send` |

---

## Media

| Legacy (Next.js) | Spring | Note |
|---|---|---|
| `GET /api/media/[...path]` *(rimane in Next.js)* | `GET /api/priv/media/{category}/{entityId}/{filename}` | Proxy blob storage Next.js + endpoint Spring con access control |
