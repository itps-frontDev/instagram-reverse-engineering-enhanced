# Comments API — Postman Collection

Collezione Postman per gli endpoint Spring Boot del modulo Comments.

## Endpoints

### 1. List Comments
**GET** `/api/priv/comments?postId={id}&limit={opt}&offset={opt}`

Recupera la lista di commenti per un post specifico con paginazione.

**Parametri query:**
- `postId` (required, number): ID del post
- `limit` (optional, number): Numero di commenti per pagina (default: 20, max: 100)
- `offset` (optional, number): Offset per paginazione (default: 0)

**Headers:**
- `Authorization: Bearer {{accessToken}}`

**Risposta successo (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 456,
        "postId": 123,
        "profileId": 789,
        "parentId": null,
        "text": "Great post!",
        "likesCount": 5,
        "createdAt": "2026-05-21T15:49:28",
        "profileUsername": "johndoe",
        "profileFullName": "John Doe",
        "profileImageUrl": "https://...",
        "profileIsVerified": false,
        "profileHasActiveStory": true,
        "profileHasViewedStory": false,
        "profileIsPrivate": false,
        "isLikedByCurrentUser": false
      }
    ],
    "total": 42,
    "hasMore": true
  },
  "message": "Comments retrieved successfully"
}
```

**Errori comuni:**
- **400** — `COMMENT_VALIDATION_ERROR`: postId non positivo o parametri invalidi
- **403** — `COMMENT_FORBIDDEN`: Non hai accesso al profilo proprietario del post
- **404** — `COMMENT_NOT_FOUND`: Post non trovato

---

### 2. Create Comment
**POST** `/api/priv/comments`

Crea un nuovo commento o una reply a un commento esistente.

**Headers:**
- `Authorization: Bearer {{accessToken}}`
- `Content-Type: application/json`

**Body (JSON):**
```json
{
  "postId": 123,
  "text": "Great post!",
  "parentId": null
}
```

**Validazioni:**
- `postId`: Numero positivo, post deve esistere e comments non disabilitati
- `text`: 1-2200 caratteri, non vuoto
- `parentId`: (opzionale) Numero positivo. Se presente, il commento padre deve esistere nello stesso post

**Logica counter:**
- Se `parentId` è `null` (commento top-level): incrementa `posts.comments_count` di 1
- Se `parentId` non è `null` (reply): non incrementa counter, nidifica la reply

**Notifiche:**
- Top-level: invia notifica "comment" al post owner
- Reply: invia notifica "comment_reply" all'autore del commento padre
- Non invia notifica a se stesso

**Risposta successo (201):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "postId": 123,
    "profileId": 789,
    "parentId": null,
    "text": "Great post!",
    "likesCount": 0,
    "createdAt": "2026-05-21T15:49:28",
    "profileUsername": "yourusername",
    "profileFullName": "Your Name",
    "profileImageUrl": "https://...",
    "profileIsVerified": false,
    "profileHasActiveStory": false,
    "profileHasViewedStory": false,
    "profileIsPrivate": false,
    "isLikedByCurrentUser": false
  },
  "message": "Comment created successfully"
}
```

**Errori comuni:**
- **400** — `COMMENT_VALIDATION_ERROR`: Text vuoto, troppo lungo, o parentId invalido
- **403** — `COMMENT_FORBIDDEN`: Comments disabilitati per questo post
- **404** — `COMMENT_NOT_FOUND`: Post non trovato o parent comment non esiste

---

### 3. Delete Comment
**DELETE** `/api/priv/comments/{commentId}`

Soft-delete di un commento.

**Path parameters:**
- `commentId` (required, number): ID del commento da eliminare

**Headers:**
- `Authorization: Bearer {{accessToken}}`

**Autorizzazione (uno dei due suffisso):**
- L'utente autenticato è l'autore del commento
- L'utente autenticato è il proprietario del post

**Logica counter:**
- Se il commento è top-level (`parentId IS NULL`): decrementa `posts.comments_count` di 1
- Se è una reply (`parentId NOT NULL`): non modifica counter

**Soft-delete semantica:**
- Commento marcato con `deleted_at = NOW()`
- Non è hard-delete, il record rimane nel DB con `deleted_at` valorizzato
- Le query successive scartano commenti con `deleted_at IS NOT NULL`

**Risposta successo (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Comment deleted successfully"
}
```

**Errori comuni:**
- **403** — `COMMENT_FORBIDDEN`: Non sei autorizzato a eliminare questo commento
- **404** — `COMMENT_NOT_FOUND`: Commento non trovato

---

## Variabili d'ambiente

Assicurati che il file d'ambiente `IREE - Local.environment.yaml` includa:

```yaml
- key: baseUrl
  value: 'http://localhost:8080'  # o il tuo endpoint Spring Boot
- key: accessToken
  value: 'your-jwt-token'

# Comment-specific variables
- key: postId
  value: '1'  # ID di un post valido per testare
- key: commentId
  value: '1'  # ID di un commento esistente
- key: commentLimit
  value: '20'  # Default limit
- key: commentOffset
  value: '0'   # Default offset
```

## Testing Flow

1. **Login** per ottenere un `accessToken` valido (Auth collection)
2. **List Comments** per un post esistente (es. postId: 1)
3. **Create Comment** con il postId ottenuto
4. **Delete Comment** utilizzando il commentId del commento appena creato

---

**Note:**
- Tutti gli endpoint richiedono autenticazione (Bearer token)
- Il modulo comments è disponibile solo su Spring Boot (`/api/priv/comments`)
- Le legacy route Next.js (`/api/feed/comments`) sono state rimosse
- Privacy enforcement: non puoi commentare su post di profili privati senza follow accettato
