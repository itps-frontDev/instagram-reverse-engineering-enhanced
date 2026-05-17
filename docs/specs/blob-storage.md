# Blob Storage Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.1 (post adversarial review)  
**Scope:** Blob storage infrastructure + media serving endpoint + profile image upload + dev seeder + frontend proxy adaptation

## 1. Objective

Replace the filesystem-based media storage in Next.js with Azure Blob Storage (Azurite in dev, real Azure Blob Storage in prod) managed by Spring Boot. All media files (profile pictures, post images, story images, reel videos) are stored in blob storage and served through a single Spring Boot media endpoint with per-category access control. A dev-only seeder downloads existing seed media from external URLs (pravatar, picsum, Google Storage) and re-uploads them to Azurite on first startup, ensuring full blob-storage parity in development.

### Expected outcome

1. New `backend/src/main/java/it/evodev/instagram/media/` module with `config`, `controller`, `dto`, `enums`, `exceptions`, `seeder`, `service`, `strategies` packages.
2. `BlobStorageService` interface + `AzureBlobStorageService` implementation backed by Spring Cloud Azure SDK (already present in `build.gradle`).
3. `GET /api/media/{category}/{entityId}/{filename}` endpoint on Spring Boot replaces the Next.js `GET /api/media/[...path]` route.
4. `PUT /api/priv/profiles/me/image` and `DELETE /api/priv/profiles/me/image` handle profile picture upload/removal, replacing Next.js `POST /api/profiles/upload-image` and `POST /api/profiles/remove-image`.
5. `DevBlobSeeder` (`@Profile("dev")`, `ApplicationRunner`) migrates all external URLs in the dev seed DB to blob paths on first startup; idempotent on subsequent runs.
6. Sample video `src/main/resources/seed-media/sample.mp4` (≤ 5 MB, Creative Commons) bundled in the jar and used for all reel posts in dev seeding.
7. Next.js `GET /api/media/[...path]` route becomes a thin proxy to `http://backend:8080/api/media/{path}` — no filesystem reads, no DB access control. The proxy **forwards the JWT Bearer token** extracted from the HTTP-only cookie so Spring Boot can authenticate the caller for private content.
8. Next.js `POST /api/profiles/upload-image` and `POST /api/profiles/remove-image` routes delegate to Spring Boot endpoints.
9. `frontend/src/lib/storage.ts` is **not deleted in this spec** — deletion is deferred until post creation is also migrated (see Section 15 — Cleanup Plan).
10. Postman collection added at `postman/collections/media/`.

## 2. Scope Boundaries

### In scope

1. `media` Spring Boot module: `BlobStorageConfig`, `BlobStorageService` + `AzureBlobStorageService`, `MediaController`, access strategies, `DevBlobSeeder`, exceptions.
2. Profile image upload/delete endpoints (`PUT`/`DELETE /api/priv/profiles/me/image`) in new `PrivateProfileController` within the `auth` package.
3. `ProfileImageExceptionHandler` in the `auth` package (scoped to `it.evodev.instagram.auth`) — handles upload/delete validation errors.
4. `DevBlobSeeder`: profiles (pravatar), post images (picsum), story images (picsum), reel videos (bundled `sample.mp4`).
5. Liquibase: **no new changesets** — `DevBlobSeeder` migrates URLs at application level via JDBC.
6. Frontend adaptation: Next.js `/api/media/[...path]` thin proxy with JWT forwarding + profile upload/remove route delegation.
7. Postman collection for media endpoints.
8. Spring Security: permit `/api/media/**` without JWT rejection at filter level (invalid JWT treated as anonymous).
9. `spring.servlet.multipart` size limits in `application.properties`.

### Out of scope

1. Post creation migration to Spring Boot (separate spec — `posts/create` still uses `storage.ts`).
2. Story creation migration (separate spec).
3. Message attachment upload (separate spec).
4. CDN integration, SAS URL generation, or direct browser-to-Azure upload.
5. Image resizing, thumbnail generation, or format conversion.
6. Video transcoding.
7. `storage.ts` deletion — deferred until all callers are migrated.

## 3. Current State

### Next.js storage module

`frontend/src/lib/storage.ts`:

| Function | Current behavior |
|---|---|
| `saveFile(buffer, originalName, category, entityId)` | Writes to `data/uploads/{category}/{entityId}/{uuid}.{ext}` on disk |
| `readFile(category, entityId, filename)` | Reads Buffer from disk |
| `deleteFile(category, entityId, filename)` | `unlinkSync` |
| `deleteEntityFiles(category, entityId)` | `rmSync` recursive directory delete |
| `listEntityFiles(category, entityId)` | `readdirSync` |
| `fileExists(category, entityId, filename)` | `existsSync` |

### Next.js routes that call `storage.ts`

| Route | Method | `storage.ts` calls | Migration status in this spec |
|---|---|---|---|
| `frontend/src/app/api/profiles/upload-image/route.ts` | POST | `saveFile`, `deleteFile` | Delegated to Spring Boot |
| `frontend/src/app/api/profiles/remove-image/route.ts` | POST | `deleteFile` | Delegated to Spring Boot |
| `frontend/src/app/api/profiles/[username]/upload-image/route.ts` | POST | `saveFile`, `deleteFile` | Delegated to Spring Boot |
| `frontend/src/app/api/profiles/[username]/remove-image/route.ts` | POST | `deleteFile` | Delegated to Spring Boot |
| `frontend/src/app/api/posts/create/route.ts` | POST | `saveFile` | **Retained — out of scope** |
| `frontend/src/app/api/media/[...path]/route.ts` | GET | `readFile`, `getMimeType` | Replaced with Spring proxy |

### Dev seed external URLs to migrate

| Table | Field | Current value pattern | Rows affected |
|---|---|---|---|
| `profiles` | `profile_image_url` | `https://i.pravatar.cc/300?u={username}` | 76 (indices 4–79) |
| `post_media` | `media_url` | `https://picsum.photos/seed/post{postId}img{k}/1080/1350` | ~1100 image rows |
| `post_media` | `media_url` | One of 10 Google Storage sample video URLs | 20 reel rows |
| `stories` | `media_url` | `https://picsum.photos/seed/story{profileId}img{j}/1080/1920` | ~440 story rows |

### Spring Boot prerequisites (already done)

- `com.azure.spring:spring-cloud-azure-starter-storage-blob` in `build.gradle`
- `spring.cloud.azure.storage.blob.connection-string` and `.container-name` in `application.properties`
- Azurite configured in `docker-compose.override.yml` with fixed dev connection string
- `AZURE_STORAGE_CONNECTION_STRING` / `AZURE_STORAGE_CONTAINER_NAME` env vars in both compose files

## 4. Target Architecture

### 4.1 Backend module layout

```
backend/src/main/java/it/evodev/instagram/media/
├── config/
│   └── BlobStorageConfig.java
├── controller/
│   └── MediaController.java             # GET /api/media/{category}/{entityId}/{filename}
├── dto/
│   └── BlobUploadResult.java
├── enums/
│   └── MediaCategory.java
├── exceptions/
│   ├── BlobStorageException.java        # 500 — Azure SDK failures
│   ├── InvalidMediaCategoryException.java # 400
│   ├── MediaAccessDeniedException.java  # 403
│   ├── MediaNotFoundException.java      # 404
│   ├── MediaUnauthenticatedException.java # 401
│   ├── StoryExpiredException.java       # 410 — semantically distinct from access denied
│   └── MediaExceptionHandler.java       # @RestControllerAdvice(basePackages = "it.evodev.instagram.media")
├── seeder/
│   └── DevBlobSeeder.java               # @Profile("dev"), ApplicationRunner
├── service/
│   ├── BlobStorageService.java
│   └── impl/
│       └── AzureBlobStorageService.java
└── strategies/
    ├── MediaAccessStrategy.java
    ├── MediaAccessStrategyRegistry.java
    ├── ProfileMediaAccessStrategy.java
    ├── PostMediaAccessStrategy.java
    ├── StoryMediaAccessStrategy.java
    └── MessageMediaAccessStrategy.java
```

New files in existing `auth` package:

```
backend/src/main/java/it/evodev/instagram/auth/
├── controllers/
│   └── PrivateProfileController.java    # PUT/DELETE /api/priv/profiles/me/image
├── dto/
│   └── ProfileImageResponseDTO.java
└── exceptions/
    └── ProfileImageExceptionHandler.java  # @RestControllerAdvice(basePackages = "it.evodev.instagram.auth")
```

`ProfileImageExceptionHandler` is scoped to `it.evodev.instagram.auth` and handles upload validation exceptions (`ProfileImageValidationException` and its subclasses) so they produce the correct HTTP responses. `MediaExceptionHandler` is scoped to `it.evodev.instagram.media` and handles media serving exceptions. The scopes do not overlap.

### Architectural rules

1. `BlobStorageService` is pure infrastructure — no HTTP types, no security context, no domain knowledge. Accepts `InputStream`.
2. `MediaController` orchestrates: validate path → resolve strategy → assert access → stream blob. Zero business logic beyond orchestration.
3. Access strategies receive `entityId` (semantics defined per-category in Section 8) + authenticated `Profile` (nullable). They throw typed domain exceptions — never return boolean.
4. `DevBlobSeeder` runs only with `@Profile("dev")`. Idempotent: blob existence is checked before upload; DB is always updated after successful upload (see Section 10).
5. `BlobStorageService.upload` accepts `InputStream` + content length + content type + blob name. Decoupled from Spring MVC types.
6. Blob container is created on startup if absent (`BlobStorageConfig` calls `createIfNotExists()`).
7. Logging: `debug` for individual media requests served; `info` for seeder batch summaries; `warn` for access denials, missing blobs, and best-effort failures; `error` for Azure SDK failures.

## 5. Configuration Design

### `BlobStorageConfig`

```java
@Configuration
public class BlobStorageConfig {

    @Value("${spring.cloud.azure.storage.blob.connection-string}")
    private String connectionString;

    @Value("${spring.cloud.azure.storage.blob.container-name}")
    private String containerName;

    @Bean
    public BlobServiceClient blobServiceClient() {
        return new BlobServiceClientBuilder()
            .connectionString(connectionString)
            .buildClient();
    }

    @Bean
    public BlobContainerClient blobContainerClient(BlobServiceClient blobServiceClient) {
        BlobContainerClient container = blobServiceClient.getBlobContainerClient(containerName);
        container.createIfNotExists();
        return container;
    }
}
```

### Properties to add to `application.properties`

```properties
# ── MULTIPART ─────────────────────────────────────────────
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

**Upload limit enforcement layers:**
- Framework level: Spring rejects any file > 10 MB before reaching controller code (returns 413).
- Controller level: `PrivateProfileController` rejects files > 5 MB for profile images (returns 400 `FILE_TOO_LARGE`). This is a business rule stricter than the framework limit.
- Post creation (out of scope) retains its own enforcement via `storage.ts` until migrated.

## 6. Enums and DTO Design

### `MediaCategory` enum

```java
public enum MediaCategory {
    PROFILES("profiles"),
    POSTS("posts"),
    STORIES("stories"),
    MESSAGES("messages");

    private final String path;

    MediaCategory(String path) { this.path = path; }

    public String getPath() { return path; }

    public static MediaCategory fromPath(String path) {
        return Arrays.stream(values())
            .filter(c -> c.path.equals(path))
            .findFirst()
            .orElseThrow(() -> new InvalidMediaCategoryException("Unknown media category: " + path));
    }
}
```

`InvalidMediaCategoryException` is a domain exception handled by `MediaExceptionHandler` → 400 `INVALID_CATEGORY`. Do not use `IllegalArgumentException` — it bypasses the handler.

### `BlobUploadResult` record

```java
public record BlobUploadResult(
    String blobName,    // e.g. "profiles/123/a1b2c3d4-e5f6.jpg"
    String url,         // e.g. "/api/media/profiles/123/a1b2c3d4-e5f6.jpg"
    long size,
    String contentType
) {}
```

`url` is always the proxy URL (`/api/media/...`) — never the raw Azure blob URL. Consumers store `url` in DB.

### `ProfileImageResponseDTO` record

```java
public record ProfileImageResponseDTO(boolean success, String profileImageUrl) {}
```

`profileImageUrl` is `null` in the DELETE response.

## 7. Service Design

### `BlobStorageService` interface

```java
public interface BlobStorageService {
    BlobUploadResult upload(InputStream inputStream, long contentLength, String contentType, String blobName);
    void delete(String blobName);
    InputStream download(String blobName);   // returns null if blob does not exist; caller closes stream
    boolean exists(String blobName);
}
```

`deleteAllWithPrefix` is removed from the interface — no caller exists in this spec. Add in future entity-deletion spec if needed.

### `AzureBlobStorageService` implementation

Uses `BlobContainerClient` (injected). All Azure SDK exceptions are caught and wrapped in `BlobStorageException` except 404 on download (returns null).

| Method | Azure SDK call | Error handling |
|---|---|---|
| `upload` | `blobContainerClient.getBlobClient(blobName).upload(BinaryData.fromStream(inputStream, contentLength), true)` | SDK error → `BlobStorageException` |
| `delete` | `blobContainerClient.getBlobClient(blobName).deleteIfExists()` | No exception if not found; logs `warn` |
| `download` | `blobContainerClient.getBlobClient(blobName).openInputStream()` | 404 → `null`; other SDK errors → `BlobStorageException` |
| `exists` | `blobContainerClient.getBlobClient(blobName).exists()` | SDK error → `BlobStorageException` |

**Blob name convention:** `{category.path}/{entityId}/{filename}`  
User upload filenames: `{UUID}.{ext}` derived from detected content type (see Section 9 for detection).  
Seeder filenames: `avatar.jpg`, `image-{n}.jpg`, `media.jpg`, `video.mp4` — predictable for idempotency.

## 8. Media Serving Design

### `MediaController`

Endpoint: `GET /api/media/{category}/{entityId}/{filename}`

Class-level mapping: `@RequestMapping("/api/media")`. No `priv` prefix — permitted without JWT rejection at Spring Security level (see Section 11 for exact filter behavior).

```
Flow:
1. Parse {category} via MediaCategory.fromPath() → throws InvalidMediaCategoryException → 400.
2. Validate {entityId}: must match ^[0-9]+$ regex → 400 INVALID_PATH if not.
3. Validate {filename}: must match ^[a-zA-Z0-9._-]+$ regex → 400 INVALID_PATH if not.
   Rejects: "..", "/", "\", URL-encoded sequences, null bytes, control chars.
4. Resolve currentProfile from Spring Security context.
   Null if: no JWT present, JWT expired, JWT invalid (filter treats all as anonymous — see Section 11).
5. Resolve strategy: MediaAccessStrategyRegistry.resolve(category).
6. strategy.assertCanAccess(entityId, currentProfile) → throws typed exception on denied access.
7. blobName = category.getPath() + "/" + entityId + "/" + filename.
8. InputStream blobStream = BlobStorageService.download(blobName) → null → 404 MEDIA_NOT_FOUND.
9. Determine contentType from filename extension via MIME_TYPES map.
10. Determine Content-Length from Azure blob properties (getBlobProperties().getBlobSize()).
11. Return StreamingResponseBody response to avoid materializing blob in memory:
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(contentType))
        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(blobSize))
        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
        .header("X-Content-Type-Options", "nosniff")
        .body(outputStream -> {
            try (InputStream in = blobStream) {
                in.transferTo(outputStream);
            }
        });
```

**`immutable` is not used.** Fixed-name seeder blobs (`avatar.jpg`, `image-0.jpg`) would be permanently stale in browser cache with `immutable`. `max-age=31536000` without `immutable` is the safe choice for all filenames regardless of whether they are UUID-named or seeder-named.

### entityId semantics per strategy

| Strategy | `entityId` means | DB lookup for access check |
|---|---|---|
| `ProfileMediaAccessStrategy` | `profileId` (profiles.id) | `SELECT id FROM profiles WHERE id = ? AND deleted_at IS NULL` |
| `PostMediaAccessStrategy` | `postId` (posts.id) | `SELECT p.profile_id, pr.is_private FROM posts p JOIN profiles pr ON pr.id = p.profile_id WHERE p.id = ? AND p.deleted_at IS NULL` |
| `StoryMediaAccessStrategy` | `storyId` (stories.id) | `SELECT s.profile_id, pr.is_private, s.expires_at FROM stories s JOIN profiles pr ON pr.id = s.profile_id WHERE s.id = ? AND s.deleted_at IS NULL` |
| `MessageMediaAccessStrategy` | `chatId` (chats.id) | `SELECT 1 FROM chat_participants WHERE chat_id = ? AND profile_id = ? AND deleted_at IS NULL` |

### MIME_TYPES map

```java
private static final Map<String, String> MIME_TYPES = Map.ofEntries(
    Map.entry(".jpg",  "image/jpeg"),
    Map.entry(".jpeg", "image/jpeg"),
    Map.entry(".png",  "image/png"),
    Map.entry(".gif",  "image/gif"),
    Map.entry(".webp", "image/webp"),
    Map.entry(".mp4",  "video/mp4"),
    Map.entry(".mov",  "video/quicktime"),
    Map.entry(".webm", "video/webm"),
    Map.entry(".mp3",  "audio/mpeg"),
    Map.entry(".pdf",  "application/pdf")
);
```

Unknown extension → `application/octet-stream`.

### `MediaAccessStrategy` interface

```java
public interface MediaAccessStrategy {
    MediaCategory supportedCategory();

    // Throws:
    //   MediaNotFoundException          — entity does not exist (404)
    //   MediaUnauthenticatedException   — auth required, currentProfile is null (401)
    //   MediaAccessDeniedException      — authenticated but not authorized (403)
    //   StoryExpiredException           — story exists but is expired (410)
    void assertCanAccess(String entityId, Profile currentProfile);
}
```

### Strategy access control behavior

| Strategy | Unauthenticated | Public entity | Private (not follower) | Expired |
|---|---|---|---|---|
| `ProfileMediaAccessStrategy` | Allowed | Allowed | Allowed — profile pics always public | N/A |
| `PostMediaAccessStrategy` | Allowed if public | Allowed | `401` if not authenticated; `403` if authenticated non-follower | N/A |
| `StoryMediaAccessStrategy` | `401` | Allowed if not expired | `401` if not authenticated; `403` if authenticated non-follower | `410` StoryExpiredException |
| `MessageMediaAccessStrategy` | `401` | N/A | `403` if not chat participant | N/A |

`StoryExpiredException` is a separate exception class (`extends RuntimeException`) mapped by `MediaExceptionHandler` to HTTP 410. It is **not** a subtype of `MediaAccessDeniedException` — expired is not the same as forbidden.

### `MediaAccessStrategyRegistry`

```java
@Component
public class MediaAccessStrategyRegistry {

    private final EnumMap<MediaCategory, MediaAccessStrategy> registry;

    public MediaAccessStrategyRegistry(List<MediaAccessStrategy> strategies) {
        registry = new EnumMap<>(MediaCategory.class);
        strategies.forEach(s -> registry.put(s.supportedCategory(), s));
    }

    public MediaAccessStrategy resolve(MediaCategory category) {
        MediaAccessStrategy strategy = registry.get(category);
        if (strategy == null) throw new BlobStorageException("No strategy for category: " + category);
        return strategy;
    }
}
```

## 9. Profile Image Upload Design

### Upload validation — content type detection

**Do not trust `MultipartFile.getContentType()`** — it is client-supplied and can be spoofed. Validate using magic bytes:

```java
private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
    "image/jpeg", new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF},
    "image/png",  new byte[]{(byte)0x89, 0x50, 0x4E, 0x47},
    "image/gif",  new byte[]{0x47, 0x49, 0x46, 0x38},
    "image/webp", new byte[]{0x52, 0x49, 0x46, 0x46}  // check + offset 8-11 = "WEBP"
);

private String detectMimeType(InputStream inputStream) throws IOException {
    byte[] header = inputStream.readNBytes(12);
    // compare header bytes against MAGIC_BYTES entries
    // return detected MIME type or throw ProfileImageValidationException(INVALID_MIME_TYPE)
}
```

The detected MIME type determines the file extension stored in the blob name — not the original filename or the declared content type.

Extension mapping from detected type:
- `image/jpeg` → `.jpg`
- `image/png` → `.png`
- `image/gif` → `.gif`
- `image/webp` → `.webp`

The upload flow uses `PushbackInputStream` to read magic bytes then push them back before passing the full stream to `BlobStorageService.upload`.

### `PrivateProfileController`

Location: `backend/src/main/java/it/evodev/instagram/auth/controllers/PrivateProfileController.java`

Base mapping: `@RequestMapping("/api/priv/profiles")`

Validation exceptions thrown by this controller are handled by `ProfileImageExceptionHandler` (`@RestControllerAdvice(basePackages = "it.evodev.instagram.auth")`), not by `MediaExceptionHandler`.

#### PUT /api/priv/profiles/me/image

Accepts `multipart/form-data`, field `image`.

```
Flow:
1. Resolve authenticated profileId from Spring Security context.
2. file null or empty → throw ProfileImageValidationException(MISSING_FILE) → 400.
3. file.getSize() > 5 MB → throw ProfileImageValidationException(FILE_TOO_LARGE) → 400.
4. Read magic bytes to detect MIME type → throw ProfileImageValidationException(INVALID_MIME_TYPE) → 400 if not in allowed set.
5. Derive ext from detected MIME type.
6. blobName = "profiles/" + profileId + "/" + UUID.randomUUID() + "." + ext.
7. Fetch current profile → get existing profileImageUrl (nullable).
8. Upload new blob via BlobStorageService.upload(pushbackStream, file.getSize(), detectedMimeType, blobName).
9. Update profiles.profile_image_url = "/api/media/" + blobName via ProfileRepository.
10. Delete old blob (best-effort, after DB update):
    if (existingUrl != null) {
        String oldBlobName = existingUrl.replaceFirst("^/api/media/", "");
        try { BlobStorageService.delete(oldBlobName); }
        catch (Exception e) { logger.warn("Failed to delete old blob: {}", oldBlobName); }
    }
11. Return 200: ProfileImageResponseDTO(true, "/api/media/" + blobName).
```

#### DELETE /api/priv/profiles/me/image

```
Flow:
1. Resolve authenticated profileId.
2. Fetch profile → get profileImageUrl. Null → throw ProfileImageValidationException(NO_IMAGE) → 404.
3. Extract blobName: existingUrl.replaceFirst("^/api/media/", "").
4. Update profiles.profile_image_url = null via ProfileRepository.
5. BlobStorageService.delete(blobName) — best-effort after DB update.
6. Return 200: ProfileImageResponseDTO(true, null).
```

## 10. DevBlobSeeder Design

### Class structure

```java
@Component
@Profile("dev")
public class DevBlobSeeder implements ApplicationRunner {

    private static final int    THREAD_POOL_SIZE = 20;
    private static final String PRAVATAR_URL      = "https://i.pravatar.cc/150?u=%s";
    private static final String PICSUM_POST_URL   = "https://picsum.photos/seed/post%sidx%s/800/1000";
    private static final String PICSUM_STORY_URL  = "https://picsum.photos/seed/story%sidx%s/800/1000";
    private static final int    HTTP_TIMEOUT_MS   = 15_000;

    // Injected: BlobStorageService, JdbcTemplate
}
```

### Idempotency model

True idempotency requires two checks:

1. **Before upload:** `BlobStorageService.exists(blobName)` — if blob already exists in Azurite, skip upload entirely.
2. **DB update:** always execute after a successful upload (whether new or already-existing blob) — idempotent write.

```
For each row:
  blobName = buildBlobName(row)
  if (!blobStorageService.exists(blobName)) {
      byte[] data = downloadFromExternalUrl(row.mediaUrl)
      blobStorageService.upload(new ByteArrayInputStream(data), data.length, contentType, blobName)
  }
  jdbcTemplate.update("UPDATE {table} SET {urlField} = ? WHERE id = ?", "/api/media/" + blobName, row.id)
```

This handles all failure modes:
- Upload OK + DB update failed → next run: blob exists, skip upload, DB update retried
- Upload failed → `exists()` returns false next run, upload retried from scratch
- Both OK → `exists()` returns true, DB already correct, no-op

### Idempotency filter (query)

All four seed methods query only rows where the URL starts with `http`:

```sql
WHERE {urlField} LIKE 'http%'
```

If URL already starts with `/api/media/`, the row is already fully migrated — excluded from query. On second startup with a fully migrated DB, all queries return 0 rows.

### seedProfiles

```sql
SELECT id, profile_image_url, username FROM profiles WHERE profile_image_url LIKE 'http%'
```

For each row: download `https://i.pravatar.cc/150?u={username}`, `blobName = "profiles/{id}/avatar.jpg"`, content type `image/jpeg`.

### seedPostImages

```sql
SELECT id, post_id, position, media_url FROM post_media WHERE media_type = 'image' AND media_url LIKE 'http%'
```

For each row: download `https://picsum.photos/seed/post{post_id}idx{position}/800/1000`, `blobName = "posts/{post_id}/image-{position}.jpg"`, content type `image/jpeg`.

### seedStories

```sql
SELECT s.id, s.profile_id,
       ROW_NUMBER() OVER (PARTITION BY s.profile_id ORDER BY s.id) - 1 AS story_idx,
       s.media_url
FROM stories s WHERE s.media_url LIKE 'http%'
```

For each row: download `https://picsum.photos/seed/story{profile_id}idx{story_idx}/800/1000`, `blobName = "stories/{id}/media.jpg"`, content type `image/jpeg`.

### seedReels

Load `sample.mp4` from classpath before processing rows:

```java
InputStream videoStream = getClass().getClassLoader().getResourceAsStream("seed-media/sample.mp4");
if (videoStream == null) {
    logger.error("[DevBlobSeeder] seed-media/sample.mp4 not found in classpath — reel seeding skipped");
    return 0;
}
byte[] sampleVideo = videoStream.readAllBytes();
```

```sql
SELECT id, post_id FROM post_media WHERE media_type = 'video' AND media_url LIKE 'http%'
```

For each row: `blobName = "posts/{post_id}/video.mp4"`, upload same `sampleVideo` bytes, content type `video/mp4`.

### Parallelism and resource management

```java
private <T> int processInParallel(List<T> rows, Consumer<T> task) {
    ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    AtomicInteger successCount = new AtomicInteger(0);
    try {
        List<CompletableFuture<Void>> futures = rows.stream()
            .map(row -> CompletableFuture.runAsync(() -> {
                try {
                    task.accept(row);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    logger.warn("[DevBlobSeeder] Failed to process row: {}", e.getMessage());
                }
            }, executor))
            .toList();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    } finally {
        executor.shutdown();
        try { executor.awaitTermination(60, TimeUnit.SECONDS); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
    return successCount.get();
}
```

`finally` block guarantees executor shutdown even if `join()` throws. Failed rows retain their external URL and are retried on next startup.

### `sample.mp4` requirement

File must be committed at: `backend/src/main/resources/seed-media/sample.mp4`  
Size: ≤ 5 MB, valid MP4, Creative Commons licensed.  
Source: any small public-domain MP4 (e.g., 5-second test clip from learningcontainer.com).  
Missing file: seeder logs `error`, skips reel seeding, continues with other categories.

## 11. Spring Security Configuration

### JWT filter behavior for `/api/media/**`

`/api/media/**` is `permitAll` at the Spring Security authorization level. However, the JWT filter must **not** reject requests to this path when no token or an invalid token is present — it must treat them as anonymous and continue the filter chain.

Update `JwtAuthenticationFilter` to skip authentication (but not reject) for requests matching `/api/media/**`:

```java
@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    return request.getRequestURI().startsWith("/api/media/");
}
```

If this method returns `true`, the filter chain continues without any JWT extraction. Spring Security context remains with an `AnonymousAuthenticationToken`. `MediaController` then resolves `currentProfile = null` for these requests.

If a valid JWT is present in the Authorization header (forwarded by the Next.js proxy — see Section 12), the JWT filter **does** run (because `shouldNotFilter` returns false only if the header is absent). The filter sets the authenticated principal in the Security context. `MediaController` then resolves the actual `currentProfile`.

Exact behavior:
- No Authorization header → `shouldNotFilter = true` → anonymous → `currentProfile = null`
- Valid Authorization header → JWT filter runs → authenticated → `currentProfile = Profile`
- Invalid Authorization header → JWT filter throws → BUT: since filter is skipped for `/api/media/**` → anonymous

Wait — this creates a contradiction. If `shouldNotFilter` always skips the filter for `/api/media/**`, then valid tokens are also not processed. The correct approach: always run the filter on `/api/media/**`, but catch `JwtException` and set anonymous context instead of returning 401.

**Revised approach:** Override filter to catch `JwtException` on media paths and continue as anonymous instead of rejecting:

```java
// In JwtAuthenticationFilter, for requests to /api/media/**:
// If JWT parsing throws → SecurityContextHolder remains empty → controller resolves null profile
// If JWT parsing succeeds → SecurityContextHolder populated → controller resolves real profile
// Effect: valid tokens work; invalid/missing tokens fall through as anonymous
```

This requires modifying `JwtAuthenticationFilter` to wrap the JWT extraction in try/catch for media paths, continuing the filter chain with an empty security context if JWT is absent or invalid.

### `SecurityConfig` change

Add to `authorizeHttpRequests`:

```java
.requestMatchers("/api/media/**").permitAll()
```

This allows the authorization layer to pass. Authentication (JWT extraction) is handled by the filter as described above.

## 12. Frontend Adaptation

### Next.js `GET /api/media/[...path]` → thin proxy with JWT forwarding

Replace the entire handler body in `frontend/src/app/api/media/[...path]/route.ts`.

The proxy extracts the JWT from the HTTP-only cookie (server-side only) and forwards it to Spring Boot as a Bearer token. This enables Spring Boot access strategies to authenticate the caller for private content. Browser `<img src>` and `<video src>` requests automatically include cookies, which Next.js reads server-side.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";  // existing helper that reads JWT from HTTP-only cookie

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const springUrl = `${process.env.SPRING_API_BASE_URL}/api/media/${path.join("/")}`;

  const accessToken = await getAccessToken();  // null if not authenticated

  let upstream: Response;
  try {
    upstream = await fetch(springUrl, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Media service unreachable" }, { status: 503 });
  }

  if (!upstream.ok) {
    // Pass through upstream body and status transparently — preserve error semantics
    const errorBody = await upstream.text();
    return new NextResponse(errorBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  const blob = await upstream.blob();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type":           upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Length":         upstream.headers.get("Content-Length") ?? "",
      "Cache-Control":          "public, max-age=31536000",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

### Next.js profile upload/remove routes → delegate to Spring Boot

Replace the body of `frontend/src/app/api/profiles/upload-image/route.ts`:

```ts
export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const formData = await request.formData();

  let response: Response;
  try {
    response = await fetch(
      `${process.env.SPRING_API_BASE_URL}/api/priv/profiles/me/image`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
        signal: AbortSignal.timeout(30_000),
      }
    );
  } catch {
    return NextResponse.json({ error: "Servizio non disponibile" }, { status: 503 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

Apply the same pattern to:
- `frontend/src/app/api/profiles/[username]/upload-image/route.ts` → `PUT /api/priv/profiles/me/image`
- `frontend/src/app/api/profiles/remove-image/route.ts` → `DELETE /api/priv/profiles/me/image`
- `frontend/src/app/api/profiles/[username]/remove-image/route.ts` → `DELETE /api/priv/profiles/me/image`

## 13. Postman Collection

Create:

```
postman/collections/media/
├── .resources/
│   └── definition.yaml
├── Get Profile Image.request.yaml
├── Upload Profile Image.request.yaml
└── Delete Profile Image.request.yaml
```

`definition.yaml`:

```yaml
$kind: collection
name: Media
description: Endpoint per upload, download e gestione media su blob storage (Azurite in dev, Azure Blob Storage in prod).
```

`Get Profile Image.request.yaml`:

```yaml
$kind: http-request
name: Get Profile Image
description: "Serve l'immagine profilo dal blob storage. Nessuna auth richiesta (sempre pubblica). Error case: 404 se il file non esiste in Azurite."
method: GET
url: "{{baseUrl}}/api/media/profiles/{{profileId}}/{{filename}}"
order: 1000
```

`Upload Profile Image.request.yaml`:

```yaml
$kind: http-request
name: Upload Profile Image
description: "Carica o sostituisce l'immagine profilo dell'utente autenticato. Error case: 400 se file > 5MB, MIME non ammesso, o file vuoto; 401 se token mancante."
method: PUT
url: "{{baseUrl}}/api/priv/profiles/me/image"
headers:
  Authorization: Bearer {{accessToken}}
body:
  mode: formdata
  formdata:
    - key: image
      type: file
order: 2000
```

`Delete Profile Image.request.yaml`:

```yaml
$kind: http-request
name: Delete Profile Image
description: "Rimuove l'immagine profilo dell'utente autenticato. Error case: 404 se non esiste nessuna immagine profilo; 401 se token mancante."
method: DELETE
url: "{{baseUrl}}/api/priv/profiles/me/image"
headers:
  Authorization: Bearer {{accessToken}}
order: 3000
```

## 14. Migration Plan (Strangler)

1. Add `sample.mp4` to `backend/src/main/resources/seed-media/`.
2. Add multipart properties to `application.properties`.
3. Implement `media` module: `BlobStorageConfig` → `MediaCategory` → `BlobUploadResult` → exceptions → `BlobStorageService` → `AzureBlobStorageService`.
4. Implement `MediaAccessStrategy` interface + all four strategy classes + `MediaAccessStrategyRegistry`.
5. Implement `MediaController`.
6. Update `JwtAuthenticationFilter` and `SecurityConfig` for `/api/media/**` (Section 11).
7. Implement `ProfileImageResponseDTO`, `ProfileImageExceptionHandler`, and `PrivateProfileController`.
8. Implement `DevBlobSeeder`.
9. Start stack. Verify DevBlobSeeder completes: all `profile_image_url` and `media_url` start with `/api/media/` in DB; blobs retrievable via `BlobStorageService.exists()`.
10. Replace Next.js `GET /api/media/[...path]` with thin proxy (with JWT forwarding).
11. Replace Next.js profile upload/remove routes with Spring Boot delegation.
12. Test: upload profile image, verify blob in Azurite, verify `GET /api/media/profiles/{id}/{uuid}.jpg` returns correct binary.
13. Test: delete profile image, verify blob removed, `profile_image_url = null` in DB.
14. Test: GET private post image — unauthenticated → 401; follower JWT forwarded by proxy → 200.
15. Test: GET expired story media → 410.
16. Test: path traversal attempt → 400.
17. Test: upload file with spoofed MIME (rename `.exe` to `.jpg`) → 400 INVALID_MIME_TYPE.
18. Add Postman collection.

## 15. Cleanup Plan

### What changes in this spec

| Item | Action |
|---|---|
| `frontend/src/app/api/media/[...path]/route.ts` | Body replaced with Spring Boot proxy (filesystem reads removed) |
| `frontend/src/app/api/profiles/upload-image/route.ts` | Body replaced with Spring delegation (storage.ts calls removed) |
| `frontend/src/app/api/profiles/[username]/upload-image/route.ts` | Body replaced with Spring delegation |
| `frontend/src/app/api/profiles/remove-image/route.ts` | Body replaced with Spring delegation |
| `frontend/src/app/api/profiles/[username]/remove-image/route.ts` | Body replaced with Spring delegation |

### What is deferred

**`frontend/src/lib/storage.ts` is NOT deleted in this spec.**

`frontend/src/app/api/posts/create/route.ts` still imports and calls `saveFile`. Deleting `storage.ts` now breaks the app at runtime. Full deletion is deferred until the post creation migration spec is implemented and verified.

When post creation migration is complete, verify with `grep -r "from '@/lib/storage'" frontend/src/` — if zero results, `storage.ts` can be deleted safely.

## 16. Security Considerations (OWASP-focused)

1. `{filename}` validated with allowlist regex `^[a-zA-Z0-9._-]+$` — prevents path traversal including URL-encoded sequences, null bytes, control chars, and Unicode homoglyphs (A01).
2. `{entityId}` validated with `^[0-9]+$` — rejects non-numeric values and any traversal attempt (A01).
3. `{category}` coerced via `MediaCategory.fromPath()` to strict enum — rejects arbitrary path injection (A01).
4. `profileId` in upload endpoint resolved from Security context only — never from request body (A01 Broken Access Control).
5. Upload MIME type validated via magic bytes inspection — client-declared content type is never trusted (A03, A05).
6. Blob content-type at serving time determined from extension via `MIME_TYPES` map — never from blob metadata or client headers (A05).
7. `X-Content-Type-Options: nosniff` on all media responses (A05).
8. Azure connection string from environment variable — never hardcoded (A02).
9. Azurite fixed dev connection string in `docker-compose.override.yml` only — not in any properties file (A02).
10. `overwrite=true` on `BlobStorageService.upload` — prevents partial blob state from blocking subsequent uploads (A04).
11. JWT proxy forwarding uses server-side HTTP-only cookie extraction — token is never exposed to browser JavaScript (A02).

## 17. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Delete `storage.ts` before post creation is migrated | Defer deletion; remove only the imports of fully-migrated routes | `posts/create` still calls `saveFile`; deletion breaks the app |
| Store raw Azure blob URL in DB | Store `/api/media/{blobName}` | Raw Azure URL leaks account info, breaks in dev/Azurite, requires DB migration on every storage account change |
| Rely on `MultipartFile.getContentType()` for upload validation | Inspect magic bytes and derive type from them | Client can declare any MIME type; magic bytes cannot be faked without changing file content |
| Use `immutable` Cache-Control for all media | Use `public, max-age=31536000` without `immutable` | Seeder blobs use predictable names (`avatar.jpg`) that can be overwritten; `immutable` causes permanent browser cache staleness |
| Reject requests with invalid JWT at Spring Security filter level for `/api/media/**` | Catch JWT exception in filter, continue as anonymous | Rejecting at filter prevents legitimate browser `<img>` requests from reaching access control strategies |
| Put access control switch/if on category in `MediaController` body | Use `MediaAccessStrategyRegistry.resolve(category)` | Adding a new category requires zero controller changes |
| Scope `MediaExceptionHandler` to cover `it.evodev.instagram.auth` | Create separate `ProfileImageExceptionHandler` scoped to auth package | Mixed scope between media and auth exception handlers creates ambiguous precedence |
| Use `data.toBytes()` / `BinaryData` for serving blobs | Stream via `StreamingResponseBody` + `InputStream.transferTo` | Full blob materialization in memory is a heap amplification hazard under concurrent requests |
| Run `DevBlobSeeder` downloads single-threaded | Use 20-thread `ExecutorService` with `CompletableFuture` | ~1640 assets × ~100ms = 164s single-threaded; parallel reduces to ~10-20s |
| Upload new blob and update DB in the same transaction | Upload blob → update DB → delete old blob (sequential, best-effort delete) | Blob storage is not transactional; interleaving DB and blob ops in one unit creates inconsistent failure modes |
| Check blob existence by catching `BlobStorageException` from download | Use `BlobStorageService.exists(blobName)` | Exception-as-control-flow; `exists()` is explicit and semantically correct |
| Use `@Scheduled` or `@EventListener(ApplicationReadyEvent)` for seeder | Use `ApplicationRunner` | `ApplicationRunner` runs after Liquibase completes — seed data guaranteed present before seeder queries |

## 18. Test Case Specifications

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-MEDIA-001 | `MediaCategory.fromPath` | `"profiles"` | `MediaCategory.PROFILES` | `"invalid"` → `InvalidMediaCategoryException`; `""` → `InvalidMediaCategoryException` |
| TC-MEDIA-002 | `AzureBlobStorageService.upload` | 1 KB InputStream, `image/jpeg`, `"profiles/1/uuid.jpg"` | `BlobUploadResult` with correct blobName and url | SDK error → `BlobStorageException` |
| TC-MEDIA-003 | `AzureBlobStorageService.download` | Non-existent blobName | `null` (not exception) | SDK error other than 404 → `BlobStorageException` |
| TC-MEDIA-004 | `AzureBlobStorageService.exists` | Existing blob | `true` | Non-existent → `false`; SDK error → `BlobStorageException` |
| TC-MEDIA-005 | Magic byte detection | JPEG file bytes | `"image/jpeg"` | PNG bytes → `"image/png"`; random bytes → `INVALID_MIME_TYPE` exception; `.jpg` extension with PNG magic bytes → detected as `image/png` |
| TC-MEDIA-006 | `ProfileMediaAccessStrategy.assertCanAccess` | Any entityId, `null` currentProfile | No exception (public) | Non-existent profileId → `MediaNotFoundException` |
| TC-MEDIA-007 | `PostMediaAccessStrategy.assertCanAccess` | Private post, `null` currentProfile | `MediaUnauthenticatedException` (401) | Private post + authenticated non-follower → `MediaAccessDeniedException` (403) |
| TC-MEDIA-008 | `StoryMediaAccessStrategy.assertCanAccess` | Story with `expires_at` in past, valid follower | `StoryExpiredException` (410) | Expired + unauthenticated → `MediaUnauthenticatedException` before expiry check |
| TC-MEDIA-009 | `MediaAccessStrategyRegistry.resolve` | `MediaCategory.POSTS` | `PostMediaAccessStrategy` instance | Unmapped category → `BlobStorageException` |
| TC-MEDIA-010 | `PrivateProfileController` upload validation | 6 MB file | `400 FILE_TOO_LARGE` | Spoofed MIME (`.jpg` extension + PNG magic bytes) → accepted as PNG; `video/mp4` magic bytes → `400 INVALID_MIME_TYPE`; empty file → `400 MISSING_FILE` |
| TC-MEDIA-011 | DevBlobSeeder idempotency | Blob already exists in Azurite; DB row has `http` URL | Blob upload skipped; DB update still executes | All rows migrated → 0 external HTTP calls, 0 uploads |
| TC-MEDIA-012 | Path validation | `filename = "../../../etc/passwd"` | `400 INVALID_PATH` | `entityId = "1/../2"` → `400`; `filename = "a b.jpg"` (space) → `400` |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-MEDIA-001 | Upload profile image | Authenticated profile, valid JPEG ≤ 5 MB | `200`, blob exists in Azurite (`exists()` = true), `profiles.profile_image_url` starts with `/api/media/profiles/` | Delete blob, reset `profile_image_url = null` |
| IT-MEDIA-002 | Upload profile image — overwrite | Profile with existing blob in Azurite | Old blob deleted, new blob created with new UUID name, URL updated in DB | Delete new blob |
| IT-MEDIA-003 | Delete profile image | Profile with existing blob | `200`, blob deleted from Azurite, `profile_image_url = null` | — |
| IT-MEDIA-004 | DELETE with no existing image | `profile_image_url = null` | `404 NO_IMAGE` | — |
| IT-MEDIA-005 | GET profile image — unauthenticated | Blob in Azurite, no auth header, JWT not forwarded | `200`, binary body, `Content-Type: image/jpeg`, `Cache-Control: public, max-age=31536000` | — |
| IT-MEDIA-006 | GET private post image — unauthenticated | Private profile's post blob, no JWT forwarded | `401 AUTH_REQUIRED` | — |
| IT-MEDIA-007 | GET private post image — follower JWT forwarded | Private profile + follower JWT in proxy header | `200`, binary body | — |
| IT-MEDIA-008 | GET story image — expired | Story blob + `expires_at = NOW() - 1 hour` | `410 STORY_EXPIRED` | — |
| IT-MEDIA-009 | GET unknown category | `GET /api/media/invoices/1/file.pdf` | `400 INVALID_CATEGORY` | — |
| IT-MEDIA-010 | Path traversal | `GET /api/media/profiles/1/../../../secret` | `400 INVALID_PATH` | — |
| IT-MEDIA-011 | Upload spoofed MIME | File with `.jpg` extension and `video/mp4` magic bytes | `400 INVALID_MIME_TYPE` | — |
| IT-MEDIA-012 | DevBlobSeeder first run | Fresh DB, all external URLs | All `profile_image_url` and `media_url` → `/api/media/...`; blobs accessible via `download()` | — |
| IT-MEDIA-013 | DevBlobSeeder second run | Fully migrated DB | 0 external HTTP calls, 0 uploads, no errors | — |
| IT-MEDIA-014 | Concurrent upload (same profile) | Two simultaneous PUT requests for same profileId | Last writer wins; both blobs created; only one referenced in DB; other orphaned (acceptable) | Delete both blobs |
| IT-MEDIA-015 | Azurite unavailable on startup | Azurite container stopped | `BlobStorageConfig` `createIfNotExists()` throws; Spring Boot fails to start with clear error | — |

## 19. Error Handling Matrix

`MediaExceptionHandler` — `@RestControllerAdvice(basePackages = "it.evodev.instagram.media")`  
`ProfileImageExceptionHandler` — `@RestControllerAdvice(basePackages = "it.evodev.instagram.auth")`

Both return:
```json
{ "success": false, "error": "ERROR_CODE", "message": "Human-readable message.", "timestamp": "ISO-8601" }
```

| Error type | Exception class | HTTP | Code | Handler | Logging |
|---|---|---|---|---|---|
| Unknown category | `InvalidMediaCategoryException` | 400 | `INVALID_CATEGORY` | MediaExceptionHandler | `warn` |
| Invalid path (traversal or format) | `IllegalArgumentException` (path validation) | 400 | `INVALID_PATH` | MediaExceptionHandler | `warn` |
| Entity not found (strategy) | `MediaNotFoundException` | 404 | `MEDIA_NOT_FOUND` | MediaExceptionHandler | `warn` |
| Auth required, no token | `MediaUnauthenticatedException` | 401 | `AUTH_REQUIRED` | MediaExceptionHandler | `warn` |
| Authenticated, not authorized | `MediaAccessDeniedException` | 403 | `ACCESS_DENIED` | MediaExceptionHandler | `warn` |
| Story expired | `StoryExpiredException` | 410 | `STORY_EXPIRED` | MediaExceptionHandler | `warn` |
| Blob not found in storage | `download()` returns null → `MediaNotFoundException` | 404 | `MEDIA_NOT_FOUND` | MediaExceptionHandler | `warn` |
| Azure SDK failure | `BlobStorageException` | 500 | `BLOB_STORAGE_ERROR` | MediaExceptionHandler | `error` |
| Missing file in upload | `ProfileImageValidationException(MISSING_FILE)` | 400 | `MISSING_FILE` | ProfileImageExceptionHandler | `warn` |
| Invalid MIME type (magic bytes) | `ProfileImageValidationException(INVALID_MIME_TYPE)` | 400 | `INVALID_MIME_TYPE` | ProfileImageExceptionHandler | `warn` |
| File too large | `ProfileImageValidationException(FILE_TOO_LARGE)` | 400 | `FILE_TOO_LARGE` | ProfileImageExceptionHandler | `warn` |
| No profile image on delete | `ProfileImageValidationException(NO_IMAGE)` | 404 | `NO_IMAGE` | ProfileImageExceptionHandler | `warn` |
| Old blob delete failure | Exception caught in controller | Swallowed — upload succeeds | Orphaned blob | `warn` |
| DevBlobSeeder external URL unreachable | Exception in task | N/A (startup) | Row skipped, retried next startup | `warn` |
| DevBlobSeeder blob failure | `BlobStorageException` in task | N/A (startup) | Row skipped, retried next startup | `error` |
| DevBlobSeeder sample.mp4 missing | Null `InputStream` | N/A (startup) | Reel seeding skipped | `error` |

## 20. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Azure SDK dependency | `backend/build.gradle` | `spring-cloud-azure-starter-storage-blob` |
| Azure BOM | `backend/build.gradle` | `spring-cloud-azure-dependencies:5.24.0` |
| Azure blob connection-string property | `backend/src/main/resources/application.properties` | `spring.cloud.azure.storage.blob.connection-string` |
| Azurite dev connection string | `docker-compose.override.yml` | `AZURE_STORAGE_CONNECTION_STRING` (backend service env) |
| JwtAuthenticationFilter to modify | `backend/src/main/java/it/evodev/instagram/auth/filter/JwtAuthenticationFilter.java` | `doFilterInternal` |
| SecurityConfig authorized matchers | `backend/src/main/java/it/evodev/instagram/auth/config/SecurityConfig.java` | `authorizeHttpRequests` chain |
| Profile model — `profileImageUrl` | `backend/src/main/java/it/evodev/instagram/auth/models/Profile.java` | `profileImageUrl` field |
| ProfileRepository | `backend/src/main/java/it/evodev/instagram/auth/repositories/ProfileRepository.java` | full interface |
| LikeStrategyRegistry pattern reference | `backend/src/main/java/it/evodev/instagram/likes/strategies/LikeStrategyRegistry.java` | constructor, `resolve` |
| AuthExceptionHandler style reference | `backend/src/main/java/it/evodev/instagram/auth/exceptions/AuthExceptionHandler.java` | `@RestControllerAdvice`, response shape |
| PrivateAuthController logging style | `backend/src/main/java/it/evodev/instagram/auth/controllers/PrivateAuthController.java` | `logger.info` patterns |
| Frontend `getAccessToken` helper | `frontend/src/lib/auth.ts` | `getAccessToken` |
| Frontend media proxy route to rewrite | `frontend/src/app/api/media/[...path]/route.ts` | `GET` handler |
| Frontend profile upload route to delegate | `frontend/src/app/api/profiles/upload-image/route.ts` | `POST` handler |
| Dev seed external URLs | `backend/src/main/resources/db/changelog/seed/changelog-dev-seed.xml` | changesets `004-dev-seed-users-profiles`, `004-dev-seed-posts`, `004-dev-seed-reels`, `004-dev-seed-stories` |
| Postman definition format reference | `postman/collections/notifications/.resources/definition.yaml` | `$kind`, `name`, `description` |
| Postman request format reference | `postman/collections/notifications/List Notifications.request.yaml` | all fields |
| Likes spec — strategy pattern reference | `docs/specs/likes.md` | Section 7 Strategy Pattern Design |
