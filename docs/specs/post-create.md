# Post Creation Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Migrazione endpoint POST /api/posts/create da Next.js a Spring Boot + fix decremento posts_count su cancellazione

---

## 1. Objective

Migrare la creazione di post da `frontend/src/app/api/posts/create/route.ts` (Next.js + SQLite) a un endpoint Spring Boot `POST /api/priv/posts` nel modulo `it.evodev.instagram.posts`.

Contestualmente:
1. Incrementare `profiles.posts_count` alla creazione (già presente nella logica Next.js).
2. Verificare e correggere il decremento di `profiles.posts_count` alla cancellazione — il metodo `deletePost` in `PostsDetailServiceImpl` attualmente **non decrementa** il contatore.
3. Completare il cleanup di `storage.ts` (bloccato dallo spec blob-storage.md, Section 15 — questo spec lo sblocca).
4. Aggiungere la collezione Postman.

### Expected outcome

1. Nuovi file nel modulo `posts` esistente: `PostCreateController`, `PostCreateService`, `PostCreateServiceImpl`, DTOs, eccezioni.
2. `PostSavePost.java` aggiornato con i campi mancanti: `location`, `isCommentsDisabled`, `isLikesHidden`, `updatedAt` + `@GeneratedValue` sull'id.
3. `Profile.java` aggiornato con il campo `postsCount`.
4. `ProfileRepository` aggiornato con `incrementPostsCount` e `decrementPostsCount`.
5. `PostsDetailServiceImpl.deletePost` corretto per decrementare `posts_count`.
6. Frontend: `features/posts/actions.ts` aggiornato con `createPostAction` (multipart/form-data).
7. `frontend/src/app/api/posts/create/route.ts` eliminato.
8. `frontend/src/lib/storage.ts` eliminato (zero caller rimanenti dopo questa migrazione).
9. Collezione Postman `postman/collections/posts/`.

---

## 2. Scope Boundaries

### In scope

1. `POST /api/priv/posts` — endpoint di creazione post (multipart/form-data, max 10 immagini).
2. Upload immagini su Azure Blob Storage tramite `BlobStorageService` esistente.
3. Creazione record `posts` + `post_media` in transazione atomica.
4. Incremento `profiles.posts_count` nel flusso di creazione.
5. Fix decremento `profiles.posts_count` nel flusso di cancellazione (`deletePost`).
6. Aggiornamento `PostSavePost.java` con campi mancanti (`location`, `isCommentsDisabled`, `isLikesHidden`, `updatedAt`, `@GeneratedValue`).
7. Aggiornamento `Profile.java` con `postsCount`.
8. Aggiornamento `ProfileRepository` con query di incremento/decremento.
9. Frontend: server action `createPostAction`, migrazione form di creazione.
10. Cleanup: eliminazione route Next.js + `storage.ts`.
11. Postman collection `postman/collections/posts/Create Post.request.yaml`.

### Out of scope

1. Upload video per post (solo immagini; i video sono gestiti nel modulo reels).
2. Post tagging (`post_tags`) — già migrato separatamente.
3. Notifiche alla creazione di post (separate spec).
4. Feed aggiornato in real-time dopo creazione.
5. PATCH/GET/DELETE post — già migrati in `PostsDetailController`.

---

## 3. Current State

### Next.js route da eliminare

| File | Metodo | Comportamento attuale |
|---|---|---|
| `frontend/src/app/api/posts/create/route.ts` | `POST` | Accetta JSON con `images: string[]` (base64), caption, location, flags; salva su filesystem via `storage.ts`; incrementa `posts_count` |

### Bug da correggere

| File | Metodo | Bug |
|---|---|---|
| `backend/src/main/java/it/evodev/instagram/posts/service/impl/PostsDetailServiceImpl.java` | `deletePost` (riga 137) | Soft-delete post + media ma **non decrementa** `profiles.posts_count` |

### Campi mancanti in `PostSavePost.java`

Il DB (`changelog-posts.xml`) ha:

```
location             TEXT
is_comments_disabled BOOLEAN NOT NULL DEFAULT FALSE
is_likes_hidden      BOOLEAN NOT NULL DEFAULT FALSE
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Nessuno dei quattro è mappato nell'entità. Inoltre `id` non ha `@GeneratedValue` — la creazione tramite JPA fallirebbe senza di esso.

### Campi mancanti in `Profile.java`

Il DB (`changelog-profiles.xml`) ha `posts_count INTEGER NOT NULL DEFAULT 0`. Non è mappato nell'entità `Profile.java`. `ProfileRepository` non ha query di incremento/decremento.

### `storage.ts` — dipendenza bloccante

`frontend/src/lib/storage.ts` è l'unico caller rimanente dopo la migrazione blob-storage (`postman/collections/media`). Dopo questa migrazione, `grep -r "from '@/lib/storage'" frontend/src/` torna zero risultati → il file può essere eliminato in sicurezza.

---

## 4. Target Architecture

### 4.1 Nuovi file nel modulo `posts`

```
backend/src/main/java/it/evodev/instagram/posts/
├── controller/
│   └── PostCreateController.java          # POST /api/priv/posts
├── dto/
│   ├── request/
│   │   └── PostCreateRequest.java         # @RequestParam campi + @RequestPart immagini
│   └── response/
│       └── PostCreateResponseDTO.java     # { postId }
├── exception/
│   ├── PostCreateValidationException.java # 400
│   └── PostCreateUnauthorizedException.java # 401/403
└── service/
    ├── PostCreateService.java             # interfaccia
    └── impl/
        └── PostCreateServiceImpl.java
```

Modifiche a file esistenti:

```
posts/model/PostSavePost.java              # + location, isCommentsDisabled, isLikesHidden, updatedAt, @GeneratedValue
posts/exception/PostsExceptionHandler.java # + handler per PostCreate*Exception
posts/service/impl/PostsDetailServiceImpl.java  # + decrementPostsCount nel deletePost
auth/models/Profile.java                   # + postsCount
auth/repositories/ProfileRepository.java   # + incrementPostsCount, decrementPostsCount
```

### 4.2 Nuovi file nel frontend

```
frontend/src/features/posts/
├── schema.ts      # già esistente — aggiungere createPostInputSchema, CreatePostInput
├── actions.ts     # già esistente — aggiungere createPostAction
└── index.ts       # già esistente — ri-esportare createPostAction
```

File da eliminare:

```
frontend/src/app/api/posts/create/route.ts
frontend/src/lib/storage.ts
```

### 4.3 Regole architetturali

1. `PostCreateController` gestisce solo HTTP ↔ DTO; zero business logic.
2. `PostCreateServiceImpl` possiede tutto il flusso: validazione, upload blob, insert post, insert media, incremento contatore — tutto in `@Transactional`.
3. Il contatore `posts_count` è modificato solo tramite query `UPDATE ... SET posts_count = posts_count ± 1` — mai leggere-modificare-scrivere per evitare race condition.
4. Le immagini vengono caricate come `MultipartFile[]` (non più base64) — il frontend aggiorna il form di conseguenza.
5. Upload blob avviene **dentro** la transazione (al fallimento del commit, i blob orfani sono accettabili — pattern stabilito in `blob-storage.md` Section 17).
6. `PostsExceptionHandler` esistente (`@RestControllerAdvice(basePackages = "it.evodev.instagram.posts")`) gestisce automaticamente le nuove eccezioni senza modifiche alla classe se estendono le eccezioni base già gestite.
7. Logging: `info` a inizio/fine creazione (con postId); `warn` per validazione; `error` per SDK Azure failure.

---

## 5. Modifiche ai Model Esistenti

### 5.1 `PostSavePost.java` — campi da aggiungere

```java
// Aggiungere @GeneratedValue all'id esistente:
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
@Column(name = "id")
private Long id;

// Nuovi campi:
@Column(name = "location")
private String location;

@Column(name = "is_comments_disabled", nullable = false)
private Boolean isCommentsDisabled;

@Column(name = "is_likes_hidden", nullable = false)
private Boolean isLikesHidden;

@Column(name = "updated_at", nullable = false)
private OffsetDateTime updatedAt;
```

`@GeneratedValue` è indispensabile per la creazione via JPA; senza di esso `postRepository.save(newPost)` non popola l'id e la successiva insert di `post_media` userebbe `null` come `post_id`.

### 5.2 `Profile.java` — campo da aggiungere

```java
@Column(name = "posts_count", nullable = false)
private int postsCount;
```

### 5.3 `ProfileRepository.java` — metodi da aggiungere

```java
@Modifying
@Transactional
@Query("UPDATE Profile p SET p.postsCount = p.postsCount + 1 WHERE p.id = :id")
void incrementPostsCount(@Param("id") Long id);

@Modifying
@Transactional
@Query("UPDATE Profile p SET p.postsCount = GREATEST(p.postsCount - 1, 0) WHERE p.id = :id")
void decrementPostsCount(@Param("id") Long id);
```

`GREATEST(..., 0)` è una guardia: impedisce che un bug pregresso (post senza contatore allineato) porti il contatore sottozero. Non mascherare i bug — loggarli se count era già 0.

---

## 6. Fix `PostsDetailServiceImpl.deletePost`

### Stato attuale (riga 137–143)

```java
@Override
@Transactional
public void deletePost(String authSubject, Long postId) {
    PostSavePost post = validateOwnerAndGetPost(authSubject, postId);
    OffsetDateTime now = OffsetDateTime.now();
    post.setDeletedAt(now);
    postRepository.save(post);
    postMediaRepository.softDeleteByPostId(postId, now);
    // ← MANCA il decremento
    logger.info("Post soft-deleted. Post ID: {}", postId);
}
```

### Stato target

```java
@Override
@Transactional
public void deletePost(String authSubject, Long postId) {
    PostSavePost post = validateOwnerAndGetPost(authSubject, postId);
    OffsetDateTime now = OffsetDateTime.now();
    post.setDeletedAt(now);
    postRepository.save(post);
    postMediaRepository.softDeleteByPostId(postId, now);
    profileRepository.decrementPostsCount(post.getProfileId());
    logger.info("Post soft-deleted. Post ID: {}", postId);
}
```

`profileRepository` è già iniettato in `PostsDetailServiceImpl` (riga 47 del file esistente).

---

## 7. DTO Design

### `PostCreateRequest.java`

Non è un record `@RequestBody` — è una combinazione di `@RequestParam` e `@RequestPart`. La firma del controller riceve i parametri singolarmente (vedi Section 8).

### `PostCreateResponseDTO.java`

```java
public record PostCreateResponseDTO(Long postId) {}
```

---

## 8. Controller Design

### `PostCreateController.java`

```
@RestController
@RequestMapping("/api/priv/posts")
@RequiredArgsConstructor
```

#### `POST /api/priv/posts`

Accetta `multipart/form-data`.

```
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<PostApiResponse<PostCreateResponseDTO>> createPost(
    @RequestPart("images") List<MultipartFile> images,
    @RequestParam(required = false) String caption,
    @RequestParam(required = false) String location,
    @RequestParam(defaultValue = "false") boolean isCommentsDisabled,
    @RequestParam(defaultValue = "false") boolean isLikesHidden,
    Authentication authentication
)
```

Flusso:
```
1. logger.info("POST /api/priv/posts - request received, imageCount: {}", images.size())
2. PostCreateResponseDTO data = postCreateService.createPost(
       authentication.getName(), images, caption, location, isCommentsDisabled, isLikesHidden)
3. logger.info("POST /api/priv/posts - post created, postId: {}", data.postId())
4. return ResponseEntity.status(HttpStatus.CREATED).body(PostApiResponse.success(data, "Post created successfully"))
```

Zero business logic nel controller.

---

## 9. Service Design

### `PostCreateService.java` (interfaccia)

```java
public interface PostCreateService {
    PostCreateResponseDTO createPost(
        String authSubject,
        List<MultipartFile> images,
        String caption,
        String location,
        boolean isCommentsDisabled,
        boolean isLikesHidden
    );
}
```

### `PostCreateServiceImpl.java`

Dipendenze iniettate:
- `AuthSubjectService authSubjectService`
- `ProfileRepository profileRepository`
- `PostRepository postRepository`
- `PostMediaRepository postMediaRepository`
- `BlobStorageService blobStorageService`

#### Flusso `createPost`

```
1. VALIDAZIONE
   - images null o vuota → PostCreateValidationException("Almeno un'immagine è richiesta")
   - images.size() > 10 → PostCreateValidationException("Massimo 10 immagini consentite")
   - Per ogni immagine: file vuoto → PostCreateValidationException("Immagine alla posizione {i} è vuota")
   - caption non null e length > 2200 → PostCreateValidationException("Caption troppo lunga (max 2200 caratteri)")

2. AUTENTICAZIONE
   - UUID userId = authSubjectService.parseUserId(authSubject, () → PostCreateUnauthorizedException)
   - Long profileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(userId)
       .orElseThrow(() → PostCreateUnauthorizedException("Profilo non trovato"))

3. CREA POST (dentro @Transactional)
   a. PostSavePost post = new PostSavePost()
      post.setProfileId(profileId)
      post.setCaption(caption != null ? caption.trim() : null)
      post.setLocation(location != null ? location.trim() : null)
      post.setIsCommentsDisabled(isCommentsDisabled)
      post.setIsLikesHidden(isLikesHidden)
      post.setLikesCount(0)
      post.setCommentsCount(0)
      post.setCreatedAt(OffsetDateTime.now())
      post.setUpdatedAt(OffsetDateTime.now())
   b. PostSavePost saved = postRepository.save(post)   ← id generato dal DB
   c. Long postId = saved.getId()

4. CARICA IMMAGINI E CREA MEDIA RECORDS
   for (int i = 0; i < images.size(); i++) {
       MultipartFile file = images.get(i);
       String contentType = detectMimeType(file.getInputStream())  ← magic bytes (ricicla logica da PrivateProfileController)
       String ext = mimeToExtension(contentType)  ← .jpg / .png / .gif / .webp
       String blobName = "posts/" + postId + "/image-" + i + "." + ext
       BlobUploadResult uploadResult = blobStorageService.upload(
           file.getInputStream(), file.getSize(), contentType, blobName)
       PostMedia media = new PostMedia()
       media.setPostId(postId)
       media.setMediaUrl(uploadResult.url())   ← "/api/media/posts/{postId}/image-{i}.{ext}"
       media.setMediaType("image")
       media.setPosition(i)
       media.setCreatedAt(OffsetDateTime.now())
       postMediaRepository.save(media)
   }

5. INCREMENTA CONTATORE
   profileRepository.incrementPostsCount(profileId)

6. RITORNA
   return new PostCreateResponseDTO(postId)
```

L'intero flusso dal punto 3 è annotato `@Transactional`. Se il commit fallisce dopo l'upload blob, i blob rimangono orfani — comportamento accettato (lo stesso pattern di `PrivateProfileController`, documentato in `blob-storage.md` Section 17).

#### Riuso `detectMimeType`

Non duplicare la logica già presente in `PrivateProfileController`. Estrarre il metodo in una utility `MediaMimeTypeDetector` (classe package-private in `it.evodev.instagram.media.util`) e iniettarla dove serve. Se già presente come utility, usarla direttamente.

**Magic bytes supportati (stesso set di `blob-storage.md`):**

| MIME | Magic bytes | Estensione |
|---|---|---|
| `image/jpeg` | `FF D8 FF` | `.jpg` |
| `image/png` | `89 50 4E 47` | `.png` |
| `image/gif` | `47 49 46 38` | `.gif` |
| `image/webp` | `52 49 46 46` (+ offset 8-11 = "WEBP") | `.webp` |

Tipo non riconosciuto → `PostCreateValidationException("Formato immagine non supportato alla posizione {i}")`.

---

## 10. Exception Design

### Nuove eccezioni

```java
// PostCreateValidationException.java — 400
public class PostCreateValidationException extends RuntimeException { ... }

// PostCreateUnauthorizedException.java — 401
public class PostCreateUnauthorizedException extends RuntimeException { ... }
```

### `PostsExceptionHandler` — aggiornamento

Aggiungere handler per le nuove eccezioni. Il formato risposta è `PostApiResponse`:

```java
@ExceptionHandler(PostCreateValidationException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public PostApiResponse<Void> handleCreateValidation(PostCreateValidationException ex) {
    logger.warn("Post create validation error: {}", ex.getMessage());
    return PostApiResponse.error(ex.getMessage());
}

@ExceptionHandler(PostCreateUnauthorizedException.class)
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public PostApiResponse<Void> handleCreateUnauthorized(PostCreateUnauthorizedException ex) {
    logger.warn("Post create unauthorized: {}", ex.getMessage());
    return PostApiResponse.error(ex.getMessage());
}
```

Verificare che `PostApiResponse` abbia un metodo `error(String)` — in caso contrario, aggiungere:

```java
public static <T> PostApiResponse<T> error(String message) {
    return new PostApiResponse<>(false, null, message);
}
```

---

## 11. Frontend Feature Module

### `features/posts/schema.ts` — aggiungere

```ts
export const createPostInputSchema = z.object({
  images: z.array(z.instanceof(File)).min(1, 'Almeno un\'immagine è richiesta').max(10, 'Massimo 10 immagini'),
  caption: z.string().max(2200).optional(),
  location: z.string().optional(),
  isCommentsDisabled: z.boolean().default(false),
  isLikesHidden: z.boolean().default(false),
});
export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const createPostResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), postId: z.number().int() }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type CreatePostResult = z.infer<typeof createPostResultSchema>;
```

### `features/posts/actions.ts` — aggiungere `createPostAction`

```ts
'use server';

export async function createPostAction(input: CreatePostInput): Promise<CreatePostResult> {
  const parsed = createPostInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Parametri non validi.' };

  const { images, caption, location, isCommentsDisabled, isLikesHidden } = parsed.data;

  const formData = new FormData();
  images.forEach(img => formData.append('images', img));
  if (caption) formData.append('caption', caption);
  if (location) formData.append('location', location);
  formData.append('isCommentsDisabled', String(isCommentsDisabled));
  formData.append('isLikesHidden', String(isLikesHidden));

  let response: Response | null = null;
  try {
    response = await springFetch('/api/priv/posts', {
      method: 'POST',
      body: formData,
      // NON impostare Content-Type: il browser/Node imposta automaticamente multipart/form-data con boundary
    });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Servizio non raggiungibile.' };
  }

  if (!response.ok) {
    if (response.status === 400) return { success: false, error: 'Immagini o dati non validi.' };
    if (response.status === 401) redirect('/login');
    return { success: false, error: 'Errore nella creazione del post.' };
  }

  const payload = await response.json();
  return { success: true, postId: payload.data.postId };
}
```

### Migrazione del form di creazione post

Il form esistente che chiama `/api/posts/create` con JSON+base64 deve essere aggiornato per usare `createPostAction`. Invece di convertire le immagini in base64 lato client, passare i `File` object direttamente all'action (Next.js Server Actions supportano `FormData` con `File`).

Trovare il form con `grep -r "api/posts/create" frontend/src/` — identificare il(i) file e aggiornare la chiamata.

### Cleanup

```
Eliminare: frontend/src/app/api/posts/create/route.ts
Eliminare: frontend/src/lib/storage.ts   ← zero caller rimanenti dopo questa migrazione
```

Verificare prima dell'eliminazione:
```bash
grep -r "from '@/lib/storage'" frontend/src/
```
Se il risultato è solo `route.ts` (che stiamo eliminando), procedere con la rimozione di `storage.ts`.

---

## 12. Postman Collection

Creare:

```
postman/collections/posts/
├── .resources/
│   └── definition.yaml
└── Create Post.request.yaml
```

### `definition.yaml`

```yaml
$kind: collection
name: Posts
description: Endpoint per la creazione e gestione dei post. Richiede autenticazione JWT.
```

### `Create Post.request.yaml`

```yaml
$kind: http-request
name: Create Post
description: >
  Crea un nuovo post con una o più immagini (max 10).
  Accetta multipart/form-data.
  Alla creazione incrementa profiles.posts_count.
  Error cases: 400 se immagini mancanti, > 10, o formato non supportato; 401 se token mancante.
method: POST
url: "{{baseUrl}}/api/priv/posts"
headers:
  Authorization: Bearer {{accessToken}}
body:
  mode: formdata
  formdata:
    - key: images
      type: file
      description: "Prima immagine del post (ripetere per carosello, max 10)"
    - key: caption
      type: text
      value: "Test caption dalla collezione Postman"
    - key: location
      type: text
      value: "Milano, Italia"
    - key: isCommentsDisabled
      type: text
      value: "false"
    - key: isLikesHidden
      type: text
      value: "false"
order: 1000
```

---

## 13. Migration Plan (Strangler)

1. **Aggiornare `PostSavePost.java`** — aggiungere `@GeneratedValue` + 4 campi mancanti.
2. **Aggiornare `Profile.java`** — aggiungere `postsCount`.
3. **Aggiornare `ProfileRepository`** — aggiungere `incrementPostsCount`, `decrementPostsCount`.
4. **Fix `PostsDetailServiceImpl.deletePost`** — aggiungere `profileRepository.decrementPostsCount(post.getProfileId())`.
5. **Creare eccezioni** `PostCreateValidationException`, `PostCreateUnauthorizedException`.
6. **Aggiornare `PostsExceptionHandler`** — aggiungere handler per le nuove eccezioni.
7. **Creare `PostCreateResponseDTO`**.
8. **Creare `PostCreateService` + `PostCreateServiceImpl`**.
9. **Creare `PostCreateController`**.
10. **Avviare il backend** — verificare che Spring si avvii senza errori, nessun conflitto con entità esistenti.
11. **Test Postman** — `POST /api/priv/posts` con una immagine, verificare: `201`, `postId` nella risposta, record `posts` e `post_media` nel DB, `profiles.posts_count` incrementato di 1.
12. **Test cancellazione** — `DELETE /api/priv/posts/{postId}`, verificare che `posts_count` si decrementato.
13. **Aggiornare frontend** — `features/posts/schema.ts` + `actions.ts`, migrare il form di creazione.
14. **Verificare grep** — `grep -r "from '@/lib/storage'" frontend/src/` = zero risultati.
15. **Eliminare** `frontend/src/app/api/posts/create/route.ts` + `frontend/src/lib/storage.ts`.
16. **Aggiungere Postman collection**.

---

## 14. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Accettare immagini base64 in JSON | Accettare `multipart/form-data` con `MultipartFile[]` | Base64 aumenta il payload del ~33%; multipart è il formato nativo per upload binari; compatibile con il limite Spring `max-request-size` già configurato |
| Risolvere `profileId` dal body della request | Risolverlo solo dal JWT via `Authentication.getName()` | Broken Access Control (OWASP A01): un utente potrebbe creare post per altri profili |
| Leggere-modificare-scrivere `posts_count` | Usare `UPDATE ... SET posts_count = posts_count ± 1` | Race condition sotto carico concorrente: due richieste parallele leggono lo stesso valore e scrivono lo stesso risultato, perdendo un incremento |
| Usare `GREATEST(..., 0)` e ignorare silenziosamente un decremento su zero | Aggiungere un `logger.warn` se `posts_count` era già 0 prima del decremento | `GREATEST` è una guardia contro valori negativi, non una licenza per ignorare dati inconsistenti |
| Fare l'upload blob fuori transazione "per sicurezza" | Tenere tutto in `@Transactional` | Upload fuori transazione non viene rollbackato se la transazione fallisce; blob orfani sono accettabili (stessa policy di `blob-storage.md`) ma la transazione garantisce la consistenza del DB |
| Duplicare la logica `detectMimeType` in `PostCreateServiceImpl` | Riusare/estrarre in `MediaMimeTypeDetector` utility | DRY: due implementazioni divergono silenziosamente; magic bytes sono critici per la sicurezza (OWASP A03) |
| Impostare `Content-Type: multipart/form-data` manualmente nel fetch | Non impostare `Content-Type` — il runtime lo imposta con il boundary corretto | Un boundary mancante o errato causa parsing fallito lato Spring |
| Eliminare `storage.ts` prima di verificare zero caller | Verificare con `grep` prima di eliminare | Eliminazione prematura rompe runtime senza errori di compilazione (import dinamici, template literals) |
| Aggiungere `@GeneratedValue` senza verificare la sequenza PostgreSQL | Verificare che la colonna usi `GENERATED BY DEFAULT AS IDENTITY` (già confermato in `changelog-posts.xml`) | `GenerationType.IDENTITY` mappa su `GENERATED ... AS IDENTITY`; usare `SEQUENCE` sarebbe un mismatch |
| Creare una nuova entità `PostCreatePost` separata | Aggiungere i campi mancanti a `PostSavePost` | La tabella è `posts`; due entità sulla stessa tabella con nomi diversi sono già presenti nel progetto (pattern accettato) ma aggiungere campi all'entità esistente è più pulito quando la stessa entità è già usata per delete/update |

---

## 15. Test Case Specifications

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-CREATE-001 | `createPost` — happy path | 1 immagine JPEG valida, caption "test" | `PostCreateResponseDTO` con `postId` > 0; record in `posts` e `post_media`; `posts_count` incrementato | Immagini null → `PostCreateValidationException` |
| TC-CREATE-002 | `createPost` — max immagini | 11 immagini | `PostCreateValidationException("Massimo 10 immagini")` | 10 immagini → OK; 0 immagini → `PostCreateValidationException` |
| TC-CREATE-003 | `createPost` — caption troppo lunga | caption di 2201 caratteri | `PostCreateValidationException("Caption troppo lunga")` | caption null → OK (campo opzionale); caption di esattamente 2200 caratteri → OK |
| TC-CREATE-004 | `createPost` — formato non supportato | Immagine con magic bytes `video/mp4` | `PostCreateValidationException("Formato immagine non supportato alla posizione 0")` | File vuoto → `PostCreateValidationException("Immagine alla posizione 0 è vuota")` |
| TC-CREATE-005 | `createPost` — profilo non trovato | authSubject con userId senza profilo | `PostCreateUnauthorizedException` | authSubject malformato → `PostCreateUnauthorizedException` |
| TC-CREATE-006 | `createPost` — carosello | 5 immagini PNG | 5 record `post_media` con `position` 0–4; `media_url` = `/api/media/posts/{id}/image-{i}.png` | Posizioni non devono avere gap |
| TC-CREATE-007 | `deletePost` — decremento contatore | Post esistente, owner autenticato | `posts_count` decrementato di 1 dopo la cancellazione | `posts_count` già a 0 → rimane 0 (GREATEST guardia), logger.warn |
| TC-CREATE-008 | `decrementPostsCount` — GREATEST | `posts_count = 0` nel DB | `posts_count` rimane 0 (non va negativo) | `posts_count = 1` → diventa 0; `posts_count = 5` → diventa 4 |
| TC-CREATE-009 | `incrementPostsCount` | Profile con `posts_count = 3` | `posts_count` diventa 4 | Chiamate parallele: `posts_count` deve riflettere tutti gli incrementi (no lost update) |
| TC-CREATE-010 | Frontend Zod — `createPostInputSchema` | `{ images: [] }` | Validation failure `min(1)` | images con File non immagine → Zod non valida MIME lato frontend (solo type checking); 11 files → `max(10)` error |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-CREATE-001 | POST /api/priv/posts — happy path | Utente autenticato, 1 immagine JPEG valida | `201`, body `{ success: true, data: { postId: N } }`; record in `posts`; 1 record in `post_media` con `position=0`; blob in Azurite; `profiles.posts_count` + 1 | Soft-delete post; delete blob; reset `posts_count` |
| IT-CREATE-002 | POST — carosello 3 immagini | Utente autenticato, 3 file PNG diversi | `201`; 3 record `post_media` con `position` 0, 1, 2; 3 blob in Azurite | Cleanup |
| IT-CREATE-003 | POST — senza token | No Authorization header | `401` | — |
| IT-CREATE-004 | POST — immagini mancanti | No campo `images` nel multipart | `400` | — |
| IT-CREATE-005 | POST — formato non valido | File PDF rinominato `.jpg` | `400 PostCreateValidationException` | — |
| IT-CREATE-006 | DELETE /api/priv/posts/{id} — decremento | Post esistente; `posts_count` iniziale noto | Dopo DELETE: `posts_count` = valore iniziale - 1 | — |
| IT-CREATE-007 | DELETE — posts_count non va negativo | `posts_count = 0`; soft-delete post | `posts_count` resta 0; logger.warn presente nel log | Reset `posts_count = 0` |
| IT-CREATE-008 | POST + DELETE — contatore allineato | Crea post, poi cancellalo | `posts_count` ritorna al valore originale | — |

---

## 16. Error Handling Matrix

| Error Type | Exception class | HTTP | Code | Handler | Logging |
|---|---|---|---|---|---|
| Immagini mancanti / lista vuota | `PostCreateValidationException` | 400 | messaggio inline | `PostsExceptionHandler` | `warn` |
| Più di 10 immagini | `PostCreateValidationException` | 400 | messaggio inline | `PostsExceptionHandler` | `warn` |
| Immagine vuota | `PostCreateValidationException` | 400 | messaggio inline | `PostsExceptionHandler` | `warn` |
| Formato immagine non supportato | `PostCreateValidationException` | 400 | messaggio inline | `PostsExceptionHandler` | `warn` |
| Caption > 2200 caratteri | `PostCreateValidationException` | 400 | messaggio inline | `PostsExceptionHandler` | `warn` |
| JWT non valido / profilo non trovato | `PostCreateUnauthorizedException` | 401 | messaggio inline | `PostsExceptionHandler` | `warn` |
| Blob storage failure (Azure SDK) | `BlobStorageException` propagata | 500 | — | Spring default (o PostsExceptionHandler se catturata) | `error` |
| Multipart troppo grande (> 50 MB) | Spring `MaxUploadSizeExceededException` | 413 | — | Spring default | Spring log |
| DB failure | `DataAccessException` propagata | 500 | — | Spring default | `error` |
| Frontend: Spring non raggiungibile | — | — | `{ success: false, error: "Servizio non raggiungibile." }` | `createPostAction` catch | Client console |
| Frontend: 401 da Spring | — | — | `redirect('/login')` | `createPostAction` | — |

---

## 17. Security Considerations (OWASP-focused)

1. `profileId` risolto esclusivamente dal Security context (JWT) — mai dal body (A01 Broken Access Control).
2. MIME type validato via magic bytes — non da `MultipartFile.getContentType()` (client-declared, spoofable) (A03, A05).
3. Upload blob su path strutturato `posts/{postId}/image-{i}.{ext}` — nessun filename user-supplied nel blobName (A01 path traversal).
4. `posts_count` modificato tramite `UPDATE ... SET posts_count ± 1` — no read-modify-write (A04 race condition).
5. `GREATEST(posts_count - 1, 0)` — nessun valore negativo nel DB (integrità dati).
6. `caption` e `location` sanitizzati con `.trim()` — nessun HTML escaping necessario (il rendering è compito del frontend) ma i valori sono trattati come testo puro (A03 XSS prevention a livello API).
7. Tutti i parametri JPA sono named parameters — no string concatenation (A03 SQL Injection prevention).

---

## 18. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Route Next.js da eliminare | `frontend/src/app/api/posts/create/route.ts` | `POST` handler |
| `storage.ts` da eliminare | `frontend/src/lib/storage.ts` | intero file |
| Blob-storage spec — cleanup plan | `docs/specs/blob-storage.md` | Section 15 |
| Blob-storage spec — upload flow | `docs/specs/blob-storage.md` | Section 9 `PrivateProfileController` |
| `BlobStorageService` interface | `backend/src/main/java/it/evodev/instagram/media/service/BlobStorageService.java` | `upload` method |
| `BlobUploadResult` record | `backend/src/main/java/it/evodev/instagram/media/dto/BlobUploadResult.java` | `url` field |
| `PostSavePost.java` da aggiornare | `backend/src/main/java/it/evodev/instagram/posts/model/PostSavePost.java` | intero file |
| `PostRepository` interfaccia | `backend/src/main/java/it/evodev/instagram/posts/repository/PostRepository.java` | intero file |
| `PostMediaRepository` interfaccia | `backend/src/main/java/it/evodev/instagram/posts/repository/PostMediaRepository.java` | intero file |
| `PostsDetailServiceImpl.deletePost` (bug) | `backend/src/main/java/it/evodev/instagram/posts/service/impl/PostsDetailServiceImpl.java` | riga 137 |
| `PostsExceptionHandler` da aggiornare | `backend/src/main/java/it/evodev/instagram/posts/exception/PostsExceptionHandler.java` | intero file |
| `PostApiResponse` (envelope) | `backend/src/main/java/it/evodev/instagram/posts/dto/response/PostApiResponse.java` | intero file |
| `PostsDetailController` (pattern reference) | `backend/src/main/java/it/evodev/instagram/posts/controller/PostsDetailController.java` | pattern `@DeleteMapping` |
| `Profile.java` da aggiornare | `backend/src/main/java/it/evodev/instagram/auth/models/Profile.java` | intero file |
| `ProfileRepository` da aggiornare | `backend/src/main/java/it/evodev/instagram/auth/repositories/ProfileRepository.java` | intero file |
| `AuthSubjectService` (risoluzione userId) | `backend/src/main/java/it/evodev/instagram/auth/services/AuthSubjectService.java` | `parseUserId` |
| `PostsSaveServiceImpl` (pattern reference) | `backend/src/main/java/it/evodev/instagram/posts/service/impl/PostsSaveServiceImpl.java` | pattern autenticazione |
| posts DB schema | `backend/src/main/resources/db/changelog/migrations/changelog-posts.xml` | changeSet `POSTS;2026-05-07;cbiallo;01` |
| profiles DB schema (posts_count) | `backend/src/main/resources/db/changelog/migrations/changelog-profiles.xml` | changeSet `PROFILES;2026-05-07;cbiallo;01` |
| post_media DB schema | `backend/src/main/resources/db/changelog/migrations/changelog-post-media.xml` | intero file |
| `features/posts/actions.ts` esistente | `frontend/src/features/posts/actions.ts` | intero file |
| `features/posts/schema.ts` esistente | `frontend/src/features/posts/schema.ts` | intero file |
| `springFetch` helper | `frontend/src/lib/spring-client.ts` | `springFetch` |
| `SpringAuthError` | `frontend/src/lib/spring-error.ts` | `SpringAuthError` |
| multipart.max config | `backend/src/main/resources/application.properties` | `spring.servlet.multipart.max-file-size` |
| Postman definition format reference | `postman/collections/media/.resources/definition.yaml` | `$kind`, `name`, `description` |
| Postman request format reference | `postman/collections/media/Upload Profile Image.request.yaml` | tutti i campi |

---

## 19. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1–7) | Pass |
| Document architecture checks (8–13) | Pass |

Critical assumptions made explicit:

1. `BlobStorageService` è già implementato (spec `blob-storage.md`). Questo spec la assume presente e funzionante.
2. `MediaMimeTypeDetector` (o logica equivalente) può essere estratta da `PrivateProfileController` senza modificare la sua firma — se non esiste ancora come utility, questo spec richiede di crearla.
3. `PostApiResponse` ha già o si aggiungerà un metodo `error(String)` — verificare prima di creare l'handler.
4. `multipart.max-file-size=10MB` e `max-request-size=50MB` sono già in `application.properties` (configurati dalla spec blob-storage). Con 10 immagini da max 10 MB = 100 MB teorici — il limite `max-request-size=50MB` copre casi reali (immagini compresse JPEG tipicamente 1–3 MB).
5. `PostRepository extends JpaRepository<PostSavePost, Long>` — dopo l'aggiunta di `@GeneratedValue`, `postRepository.save(newPost)` restituirà l'entità con `id` popolato.
6. Il frontend usa `File` object nativi — Next.js Server Actions li supportano come `FormData` entries. Non servono polyfill.
7. `springFetch` non imposta `Content-Type` manualmente — necessario per multipart: il boundary è generato dal runtime e NON deve essere sovrascritto.
