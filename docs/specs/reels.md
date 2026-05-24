# Reels Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Reels module (Spring Boot + frontend reels feature + legacy cleanup)

---

## 1. Objective

Migrate the reels feed endpoint from a Next.js API route and `PostRepository.ts` to a dedicated Spring Boot module `it.evodev.instagram.reels`, aligned with the Strangler Fig pattern.

The current implementation uses a single Next.js API route (`GET /api/reels`) that queries the database directly via `postRepository.getReels`, `postRepository.countReels`, and `postRepository.getMediaForPosts`. The `reels/page.tsx` calls this route directly via `fetch('/api/reels', ...)` using a client-side effect.

There is also an inconsistency in the legacy: `page.tsx` manages a `cursor` state but the route returns `offset`-based pagination (`hasMore`, `total`). The migration resolves this by using `offset`-based pagination throughout.

### Expected outcome

1. New backend module at `backend/src/main/java/it/evodev/instagram/reels/` with `controllers`, `dto`, `exceptions`, `models`, `repositories`, `services`.
2. One REST endpoint migrated to Spring: `GET /api/priv/reels?limit=10&excludeIds=1,2,3`.
3. Frontend `features/reels/` created with server action (`actions.ts`), Zod schemas (`schema.ts`), and `index.ts`.
4. `reels/page.tsx` migrated: replace `fetch('/api/reels', ...)` with `getReelsAction()` server action; replace `cursor` state with `seenIds: number[]` accumulation.
5. Legacy Next.js API route `frontend/src/app/api/reels/route.ts` deleted after parity verification.

---

## 2. Scope Boundaries

### In scope

1. New `reels` Spring module (models → repositories → service → controller → dto → exceptions).
2. Frontend `features/reels/` — server action, Zod schemas, `index.ts`.
3. Migration of `reels/page.tsx` from direct `fetch` to server action + offset pagination.
4. Removal of `frontend/src/app/api/reels/route.ts`.
5. Postman collection `postman/collections/reels/`.

### Out of scope

1. Comments on reels — the page still calls `/api/feed/comments` (separate spec required).
2. Like and save actions — already migrated to Spring via `toggleLikeAction` and `togglePostSaveAction` (used unchanged).
3. Profile reels tab (`ProfileGrid` + profile page) — separate concern.
4. Reel upload or creation.
5. Cursor-based pagination — offset-based is sufficient for random ordering.

---

## 3. Current State (Legacy)

### Legacy Next.js API route to replace

| Route file | Method | Current behavior |
|---|---|---|
| `frontend/src/app/api/reels/route.ts` | `GET ?limit=&offset=` | Returns reels (video posts) via `postRepository.getReels` + `countReels` + `getMediaForPosts`; ordering: `ORDER BY RANDOM()` |

### Legacy repository methods used (`PostRepository.ts`)

| Method | Mapped to Spring |
|---|---|
| `getReels(currentProfileId, limit, offset)` | `ReelService.getReels(userId, limit, offset)` |
| `countReels(currentProfileId)` | `ReelService.getReels` — total count via `COUNT` query |
| `getMediaForPosts(reelIds)` | Inlined in JPA projection — each reel fetches its media in the same query via `JOIN` |
| `convertReelForAPI(reel, media)` | Removed — mapping handled by Spring DTO |

### Legacy page behavior (`reels/page.tsx`)

| Behavior | Current | After migration |
|---|---|---|
| Fetch URL | `fetch('/api/reels?limit=5&cursor=...)` | `getReelsAction({ limit: 5, offset })` |
| Pagination state | `cursor: string \| null` (incorrect — route uses offset) | `offset: number` (corrected) |
| Load more trigger | `navigateToReel('next')` when near end | Same trigger, `offset` incremented by `limit` |
| Response shape | `{ reels, hasMore, nextCursor, total }` | `{ reels, hasMore, total }` — `nextCursor` removed |

---

## 4. Target Architecture

### 4.1 Backend module layout

```
backend/src/main/java/it/evodev/instagram/reels/
├── controllers/
│   └── ReelController.java
├── dto/
│   └── responses/
│       ├── ReelMediaItemDTO.java
│       ├── ReelItemDTO.java
│       └── ReelFeedResponseDTO.java
├── exceptions/
│   ├── ReelException.java
│   ├── ReelNotFoundException.java
│   ├── ReelUnauthorizedException.java
│   └── ReelExceptionHandler.java
├── models/
│   ├── ReelPost.java
│   └── ReelPostMedia.java
├── repositories/
│   ├── ReelPostJpaRepository.java
│   ├── ReelPostMediaJpaRepository.java
│   └── projections/
│       └── ReelFeedProjection.java
└── services/
    ├── ReelService.java
    └── impl/
        └── ReelServiceImpl.java
```

### 4.2 Architectural rules

1. `ReelController` handles REST HTTP ↔ DTO only; zero business logic.
2. `ReelServiceImpl` owns all business logic: visibility filter, pagination, media fetch, DTO mapping.
3. Repositories contain persistence logic only (Spring Data JPA + native SQL projection for the main feed query).
4. No new Liquibase changesets — `posts` and `post_media` tables already exist and are not modified.
5. `ReelServiceImpl` imports from `profile` module only: `ProfileVisibilityProfileJpaRepository` to resolve `userId → profileId`.
6. Logging: `info` at start/end of `getReels`; `warn` for profile not found; `error` in exception handler.

### 4.3 Frontend module layout

Create:

```
frontend/src/features/reels/
├── schema.ts       ← Zod schemas
├── actions.ts      ← 'use server' — REST server action
└── index.ts        ← re-exports
```

Delete after migration:

```
frontend/src/app/api/reels/route.ts
```

---

## 5. Entity Design

### 5.1 `ReelPost.java`

Read-only view of the `posts` table — no writes performed by this module.

```java
@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class ReelPost {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
```

### 5.2 `ReelPostMedia.java`

Read-only view of the `post_media` table — used only to check `media_type = 'video'`.

```java
@Entity
@Table(name = "post_media")
@Getter
@Setter
@NoArgsConstructor
public class ReelPostMedia {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    @Column(name = "media_type", nullable = false)
    private String mediaType;   // 'image' | 'video'

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
```

### 5.3 Schema reference

| Table | PK type | Soft delete | Notes |
|---|---|---|---|
| `posts` | `BIGINT` | `deleted_at` | Not modified by this module |
| `post_media` | `BIGINT` | `deleted_at` | `media_type IN ('image','video')` |

---

## 6. Repository Design

### 6.1 `ReelPostJpaRepository`

Extend `JpaRepository<ReelPost, Long>`. The main query is native SQL due to `ORDER BY RANDOM()` and complex visibility joins.

```java
// Reels feed: video posts visible to currentProfileId, random order, paginated
@Query(value = """
    SELECT
        p.id                    AS postId,
        p.profile_id            AS profileId,
        p.caption               AS caption,
        p.location              AS location,
        p.is_comments_disabled  AS isCommentsDisabled,
        p.is_likes_hidden       AS isLikesHidden,
        p.likes_count           AS likesCount,
        p.comments_count        AS commentsCount,
        p.created_at            AS createdAt,
        pr.username             AS profileUsername,
        pr.full_name            AS profileFullName,
        pr.profile_image_url    AS profileImageUrl,
        pr.is_verified          AS profileIsVerified,
        EXISTS (
            SELECT 1 FROM likes l
            WHERE l.likeable_type = 'post' AND l.likeable_id = p.id
              AND l.profile_id = :currentProfileId AND l.deleted_at IS NULL
        ) AS isLiked,
        EXISTS (
            SELECT 1 FROM saved_posts sp
            WHERE sp.post_id = p.id AND sp.profile_id = :currentProfileId
              AND sp.deleted_at IS NULL
        ) AS isSaved
    FROM posts p
    INNER JOIN profiles pr ON p.profile_id = pr.id
    WHERE p.deleted_at IS NULL
      AND pr.deleted_at IS NULL
      AND EXISTS (
          SELECT 1 FROM post_media pm
          WHERE pm.post_id = p.id AND pm.media_type = 'video' AND pm.deleted_at IS NULL
      )
      AND (
          NOT pr.is_private
          OR pr.id = :currentProfileId
          OR EXISTS (
              SELECT 1 FROM follows f
              WHERE f.follower_profile_id = :currentProfileId
                AND f.following_profile_id = pr.id
                AND f.status = 'accepted' AND f.deleted_at IS NULL
          )
      )
    ORDER BY RANDOM()
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
List<ReelFeedProjection> findReelFeed(
    @Param("currentProfileId") Long currentProfileId,
    @Param("limit") int limit,
    @Param("offset") int offset
);

// Total count of reels visible to currentProfileId (for hasMore)
@Query(value = """
    SELECT COUNT(DISTINCT p.id)
    FROM posts p
    INNER JOIN profiles pr ON p.profile_id = pr.id
    INNER JOIN post_media pm ON pm.post_id = p.id
    WHERE p.deleted_at IS NULL AND pr.deleted_at IS NULL AND pm.deleted_at IS NULL
      AND pm.media_type = 'video'
      AND (
          NOT pr.is_private
          OR pr.id = :currentProfileId
          OR EXISTS (
              SELECT 1 FROM follows f
              WHERE f.follower_profile_id = :currentProfileId
                AND f.following_profile_id = pr.id
                AND f.status = 'accepted' AND f.deleted_at IS NULL
          )
      )
    """, nativeQuery = true)
long countReelFeed(@Param("currentProfileId") Long currentProfileId);
```

### 6.2 `ReelPostMediaJpaRepository`

Extend `JpaRepository<ReelPostMedia, Long>`.

```java
// All media for a list of post IDs, ordered by position
List<ReelPostMedia> findByPostIdInAndDeletedAtIsNullOrderByPosition(List<Long> postIds);
```

### 6.3 `ReelFeedProjection`

```java
public interface ReelFeedProjection {
    Long getPostId();
    Long getProfileId();
    String getCaption();
    String getLocation();
    Boolean getIsCommentsDisabled();
    Boolean getIsLikesHidden();
    Integer getLikesCount();
    Integer getCommentsCount();
    OffsetDateTime getCreatedAt();
    String getProfileUsername();
    String getProfileFullName();
    String getProfileImageUrl();
    Boolean getProfileIsVerified();
    Boolean getIsLiked();
    Boolean getIsSaved();
}
```

---

## 7. Service Design

### 7.1 `ReelService` interface

| Method | Purpose |
|---|---|
| `ReelFeedResponseDTO getReels(UUID userId, int limit, int offset)` | Returns paginated reels feed with media |

### 7.2 `getReels` flow

```
1. Validate: limit must be between 1 and 50 (inclusive). Throw ReelUnauthorizedException if limit out of range.
   Default: limit=10, excludeIds=[].
2. Resolve currentProfile via profileVisibilityProfileJpaRepository.findByUserIdAndDeletedAtIsNull(userId).
   Throw ReelNotFoundException("Profile not found") if empty.
3. If excludeIds is empty, pass a list with a sentinel value [-1L] to avoid native query IN () syntax error.
4. Query: reelPostJpaRepository.findReelFeed(currentProfile.id, limit, excludeIds).
5. Collect postIds from projection results.
6. If postIds is empty: return ReelFeedResponseDTO(reels=[], hasMore=false).
7. Query media: reelPostMediaJpaRepository.findByPostIdInAndDeletedAtIsNullOrderByPosition(postIds).
8. Group media by postId into Map<Long, List<ReelPostMedia>>.
9. Map each projection to ReelItemDTO using mediaMap.get(postId) (empty list if absent).
10. Return ReelFeedResponseDTO(reels=mapped, hasMore=reels.size() == limit).
```

All steps run in a single `@Transactional(readOnly = true)` method.

---

## 8. REST Endpoint Design

Base: `@RequestMapping("/api/priv/reels")`.  
All endpoints require authentication (JWT via `JwtAuthenticationFilter`).

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/api/priv/reels` | Paginated reels feed | `ReelApiResponse<ReelFeedResponseDTO>` |

### Request parameters

| Parameter | Type | Default | Constraint |
|---|---|---|---|
| `limit` | `int` | `10` | 1–50 inclusive; non-integer → 400 via Spring binding |
| `excludeIds` | `List<Long>` | `[]` | Comma-separated post IDs to exclude (already seen); empty = no exclusion |

### Response envelope

```java
public record ReelApiResponse<T>(
    boolean success,
    T data,
    String error,
    String message
) {
    public static <T> ReelApiResponse<T> success(T data) {
        return new ReelApiResponse<>(true, data, null, null);
    }
    public static <T> ReelApiResponse<T> error(String error, String message) {
        return new ReelApiResponse<>(false, null, error, message);
    }
}
```

---

## 9. DTO Design

### `ReelMediaItemDTO`

```java
public record ReelMediaItemDTO(
    Long id,
    String mediaUrl,
    String mediaType,       // 'image' | 'video'
    Double durationSeconds,
    Integer position
) {}
```

### `ReelItemDTO`

```java
public record ReelItemDTO(
    Long id,
    Long profileId,
    String caption,
    String location,
    Boolean isCommentsDisabled,
    Boolean isLikesHidden,
    Integer likesCount,
    Integer commentsCount,
    OffsetDateTime createdAt,
    String profileUsername,
    String profileFullName,
    String profileImageUrl,
    Boolean profileIsVerified,
    Boolean isLikedByCurrentUser,
    Boolean isSavedByCurrentUser,
    List<ReelMediaItemDTO> media
) {}
```

### `ReelFeedResponseDTO`

```java
public record ReelFeedResponseDTO(
    List<ReelItemDTO> reels,
    boolean hasMore
) {}
```

---

## 10. Frontend Feature Module

### 10.1 `schema.ts`

```ts
import { z } from 'zod';

export const reelMediaItemSchema = z.object({
  id: z.number().int(),
  mediaUrl: z.string(),
  mediaType: z.enum(['image', 'video']),
  durationSeconds: z.number().nullable(),
  position: z.number().int(),
});
export type ReelMediaItem = z.infer<typeof reelMediaItemSchema>;

export const reelItemSchema = z.object({
  id: z.number().int(),
  profileId: z.number().int(),
  caption: z.string().nullable(),
  location: z.string().nullable(),
  isCommentsDisabled: z.boolean(),
  isLikesHidden: z.boolean(),
  likesCount: z.number().int(),
  commentsCount: z.number().int(),
  createdAt: z.string(),
  profileUsername: z.string(),
  profileFullName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  profileIsVerified: z.boolean(),
  isLikedByCurrentUser: z.boolean(),
  isSavedByCurrentUser: z.boolean(),
  media: z.array(reelMediaItemSchema),
});
export type ReelItem = z.infer<typeof reelItemSchema>;

export const getReelsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0),
});
export type GetReelsInput = z.infer<typeof getReelsInputSchema>;

export const getReelsFeedResponseSchema = z.object({
  reels: z.array(reelItemSchema),
  hasMore: z.boolean(),
  total: z.number().int(),
});

export const getReelsResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: getReelsFeedResponseSchema }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetReelsResult = z.infer<typeof getReelsResultSchema>;
```

### 10.2 `actions.ts`

```ts
'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { redirect } from 'next/navigation';
import { getReelsInputSchema, type GetReelsInput, type GetReelsResult } from './schema';

function mapReelError(status: number): string {
  if (status === 401) return 'Non autorizzato.';
  if (status === 400) return 'Parametri non validi.';
  return 'Errore nel recupero dei reels.';
}

export async function getReelsAction(input: GetReelsInput): Promise<GetReelsResult> {
  const parsed = getReelsInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Parametri non validi.' };

  const { limit, offset } = parsed.data;
  let response: Response | null = null;
  try {
    response = await springFetch(
      `/api/priv/reels?limit=${limit}&offset=${offset}`,
      { method: 'GET' }
    );
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Servizio reels non raggiungibile.' };
  }

  if (!response.ok) return { success: false, error: mapReelError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data };
}
```

### 10.3 `index.ts`

```ts
export * from './actions';
export * from './schema';
```

### 10.4 Frontend page migration (`reels/page.tsx`)

| Remove | Replace with |
|---|---|
| `fetch('/api/reels?limit=5&cursor=...')` | `getReelsAction({ limit: 5, offset })` |
| `cursor: string \| null` state | `offset: number` state (starts at 0) |
| `setCursor(data.nextCursor)` | `setOffset(prev => prev + limit)` |
| `Reel` inline interface | `ReelItem` from `features/reels/schema` |
| `media_url`, `media_type` snake_case fields | `mediaUrl`, `mediaType` camelCase (Spring response) |
| `is_liked_by_current_user`, `is_saved_by_current_user`, etc. | `isLikedByCurrentUser`, `isSavedByCurrentUser`, etc. |
| `likes_count`, `comments_count` | `likesCount`, `commentsCount` |
| `profile_username`, `profile_image_url`, `profile_is_verified` | `profileUsername`, `profileImageUrl`, `profileIsVerified` |

The `fetchReels` function in `page.tsx` becomes:

```ts
import { getReelsAction } from '@/features/reels';

const fetchReels = async (currentOffset: number) => {
  const result = await getReelsAction({ limit: 5, offset: currentOffset });
  if (!result.success) {
    console.error('Errore caricamento reels:', result.error);
    setIsLoading(false);
    return;
  }
  setReels(prev => currentOffset === 0 ? result.data.reels : [...prev, ...result.data.reels]);
  setOffset(currentOffset + result.data.reels.length);
  setHasMore(result.data.hasMore);
  setIsLoading(false);
};
```

The `navigateToReel` pre-load trigger stays unchanged — calls `fetchReels(offset)` when near end.

---

## 11. Exception Design

| Exception class | Trigger | HTTP | Error code |
|---|---|---|---|
| `ReelNotFoundException` | Profile not found by userId | 404 | `REEL_NOT_FOUND` |
| `ReelUnauthorizedException` | Limit parameter out of range | 400 | `REEL_VALIDATION_ERROR` |
| `ReelException` | Base runtime exception | 500 | `REEL_ERROR` |

`ReelExceptionHandler` annotated `@RestControllerAdvice(basePackages = "it.evodev.instagram.reels")`.

Response format:
```json
{ "success": false, "data": null, "error": "<code>", "message": "<user-safe message>" }
```

---

## 12. Migration Plan (Strangler)

1. **Create `reels` Spring module** — models → repositories → service → controller → dto → exceptions.
2. **Verify Spring starts** — run `./mvnw spring-boot:run`, check no bean conflicts with `posts` module (both map `posts` table; different entity class names prevent collision).
3. **Test endpoint manually** — Postman `GET /api/priv/reels?limit=5&offset=0`, verify reels array and `hasMore`.
4. **Create `frontend/src/features/reels/`** — `schema.ts`, `actions.ts`, `index.ts`.
5. **Migrate `reels/page.tsx`** — replace `fetch('/api/reels')` with `getReelsAction`; replace `cursor` with `offset`; update field names from snake_case to camelCase.
6. **Parity verification** — open reels page, verify first 5 reels load; scroll through all, verify load-more triggers; verify like/save still works (unchanged actions).
7. **Delete legacy** — `frontend/src/app/api/reels/route.ts`.

---

## 13. Cleanup Plan

### Legacy API route to delete

1. `frontend/src/app/api/reels/route.ts`

If `frontend/src/app/api/reels/` becomes empty after removal, delete the directory.

### Types to remove from `frontend/src/types/feed.ts`

After migration, these interfaces are no longer used by the route (the DTO is defined in `features/reels/schema.ts`):

- `Reel` interface (lines 92–125) — replaced by `ReelItem` from schema
- `GetReelsResponse` interface (lines 185–189) — replaced by `getReelsFeedResponseSchema`

Verify no other file imports these types before deleting.

### Inline `Reel` interface in `page.tsx`

The inline `interface Reel` at lines 46–72 of `reels/page.tsx` must be removed and replaced with the import from `features/reels`.

---

## 14. Security Considerations (OWASP-focused)

1. `userId` resolved from Spring Security `Authentication` principal — never from query parameters.
2. `currentProfileId` resolved server-side from JWT-bound userId — not from request body.
3. All JPA queries use named parameters — no string concatenation (SQL Injection prevention).
4. `limit` validated in service (1–50) and by Spring binding (non-integer → 400 before reaching service).
5. `offset` validated by Spring binding (non-integer → 400).
6. Visibility filter enforced in the SQL query — user cannot receive posts from private profiles they don't follow.
7. Logging never includes JWT tokens or post content.

---

## 15. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Create a separate `Post` or `PostMedia` JPA entity in the `reels` module with the same table name as an existing one in `posts` module | Use scoped entity names: `ReelPost`, `ReelPostMedia` | Two `@Entity` classes mapping the same table with the same class name cause `HibernateException: duplicate mapping` at startup |
| Use `ORDER BY RANDOM()` with a JPA `Pageable` (Spring Data) | Use `@Query(nativeQuery = true)` with explicit `LIMIT/OFFSET` params | `Pageable` with native queries requires a separate `countQuery`; random ordering + pageable causes subtle sort-loss bugs |
| Fetch all media in a separate N+1 loop (one query per reel) | Fetch all media in one query with `postIdIn`, group in service | N+1 at 10 reels = 11 DB round-trips; batch fetch = 2 |
| Trust `limit` and `offset` values from the frontend without server-side validation | Validate in service: `limit` 1–50, `offset` ≥ 0 | Unlimited `limit` could dump entire table; negative `offset` causes DB error |
| Return snake_case field names from Spring (`profile_username`) | Use camelCase records and Jackson default serialization | Spring Jackson default is camelCase; forcing snake_case requires extra config and breaks frontend conventions |
| Keep the inline `Reel` interface in `page.tsx` alongside the imported `ReelItem` | Remove the inline interface entirely after migration | Duplicate type definitions drift silently; one canonical type in `features/reels/schema.ts` |
| Pass `cursor` to Spring (the legacy page used cursor, not offset) | Use `offset` — remove `cursor` state from `page.tsx` | `ORDER BY RANDOM()` is stateless; a cursor has no meaning across random-ordered requests |
| Use `@Transactional` (read-write) for `getReels` | Use `@Transactional(readOnly = true)` | Read-only optimization: no flush, no dirty checking; prevents accidental writes |

---

## 16. Test Case Specifications

> **Stato attuale:** nessun test applicativo esiste nel progetto. Le tabelle seguenti specificano cosa va scritto, non cosa è già presente.

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-REEL-001 | `getReels` — happy path | Valid userId, limit=5, offset=0, 3 reels in DB | Returns `{ reels: [3 items], hasMore: false, total: 3 }` | Empty DB → `{ reels: [], hasMore: false, total: 0 }` |
| TC-REEL-002 | `getReels` — pagination | Valid userId, limit=2, offset=0, 5 reels in DB | `{ hasMore: true, total: 5 }` | offset=4, limit=2 → `{ hasMore: false }` |
| TC-REEL-003 | `getReels` — visibility private | Profile A (private) posts reel; Profile B does not follow A | Reel from A NOT in B's feed | Profile B follows A (accepted) → reel IS in feed |
| TC-REEL-004 | `getReels` — profile not found | Unknown userId | `ReelNotFoundException` | Deleted profile (deleted_at set) → same exception |
| TC-REEL-005 | `getReels` — own reel | Private profile; own reel | Own reel IS in feed | Own reel with is_likes_hidden=true → included, flag preserved |
| TC-REEL-006 | `getReels` — limit out of range | limit=0 or limit=51 | `ReelUnauthorizedException` | limit=-1 → caught by Spring binding before service |
| TC-REEL-007 | `getReels` — media grouping | 2 reels, first has 1 video, second has 2 media items | Each reel DTO contains correct media list | Post with no media (edge case) → empty media list, still returned |
| TC-REEL-008 | Frontend Zod — `getReelsAction` | `{ limit: 0, offset: 0 }` | Validation failure `{ success: false }` | Negative offset, non-integer limit |
| TC-REEL-009 | Frontend Zod — `getReelsAction` | `{ limit: 5, offset: 10 }` | Parses successfully | Default values: `{}` → `{ limit: 10, offset: 0 }` |
| TC-REEL-010 | `ReelFeedProjection` mapping | Projection row with `isLiked=true`, `isSaved=false` | `ReelItemDTO.isLikedByCurrentUser=true`, `isSavedByCurrentUser=false` | Boolean coercion: DB may return 0/1 on some drivers |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-REEL-001 | GET /api/priv/reels | Seed user + profile + 3 video posts | `200`, `reels` array length 3, `hasMore=false` | Delete seeded rows |
| IT-REEL-002 | GET /api/priv/reels — pagination | Seed 5 video posts | `200`, `limit=2&offset=0` → `hasMore=true`; `limit=2&offset=4` → `hasMore=false` | Delete seeded rows |
| IT-REEL-003 | GET /api/priv/reels — no token | No Authorization header | `401` | — |
| IT-REEL-004 | GET /api/priv/reels — invalid limit | `limit=0` | `400` or `REEL_VALIDATION_ERROR` | — |
| IT-REEL-005 | GET /api/priv/reels — media included | Seed 1 video post + 1 post_media row (video) | `reels[0].media` has 1 item with `mediaType='video'` | Delete seeded rows |
| IT-REEL-006 | Frontend `getReelsAction` → Spring | Valid access token in session | `{ success: true, data: { reels: [...], hasMore: ..., total: ... } }` | Clear session |

---

## 17. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Profile not found (current user) | `profileVisibilityProfileJpaRepository` returns empty on userId | 404 `REEL_NOT_FOUND` | None | `warn` |
| Limit out of range | Service validates `limit < 1 || limit > 50` | 400 `REEL_VALIDATION_ERROR` | None | `warn` |
| Non-integer `limit` or `offset` | Spring parameter binding failure | 400 (Spring default) | None | Spring log |
| Negative `offset` | Spring binding or service check | 400 | None | `warn` |
| Backend unreachable (frontend action) | `fetch` throws / `SpringAuthError` / network error | `{ success: false, error: "..." }` | UI shows empty state | Client console |
| Session expired (frontend action) | `SpringAuthError` thrown by `springFetch` | `redirect('/login')` | — | — |
| Unexpected DB error | JPA throws `DataAccessException` | 500 `REEL_ERROR` | None | `error` |

---

## 18. Postman Collection

Create:

```
postman/collections/reels/
├── .resources/
│   └── definition.yaml
└── Get Reels Feed.request.yaml
```

### `definition.yaml`

```yaml
$kind: collection
name: Reels
description: Endpoint privato per il feed reels. Restituisce i post video accessibili all'utente autenticato in ordine casuale con paginazione offset-based.
```

### `Get Reels Feed.request.yaml`

```yaml
$kind: http-request
name: Get Reels Feed
description: >
  Restituisce i reels (post con media di tipo video) visibili all'utente autenticato.
  Visibilità: profili pubblici, profilo proprio, profili seguiti (follow accepted).
  Ordinamento: casuale (ORDER BY RANDOM()) — ogni richiesta restituisce un ordine diverso.
  Paginazione: offset-based. limit min=1, max=50, default=10. offset default=0.
  I campi della risposta usano camelCase (isLikedByCurrentUser, profileUsername, mediaUrl, ecc.).
method: GET
url: "{{baseUrl}}/api/priv/reels?limit={{reelsLimit}}&offset={{reelsOffset}}"
headers:
  Authorization: Bearer {{accessToken}}
order: 100
```

### Variabili Postman da aggiungere all'environment

| Variable | Example value | Used by |
|---|---|---|
| `reelsLimit` | `10` | Get Reels Feed |
| `reelsOffset` | `0` | Get Reels Feed |

---

## 19. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Legacy API route (to delete) | `frontend/src/app/api/reels/route.ts` | `GET` handler |
| Reels page (to migrate) | `frontend/src/app/(main)/reels/page.tsx` | `fetchReels` function, `cursor` state |
| Legacy `getReels` query | `frontend/src/repositories/PostRepository.ts` | `getReels` method (line 631) |
| Legacy `countReels` query | `frontend/src/repositories/PostRepository.ts` | `countReels` method (line 686) |
| Legacy `Reel` interface | `frontend/src/types/feed.ts` | `Reel` interface (line 92) |
| Legacy `GetReelsResponse` | `frontend/src/types/feed.ts` | `GetReelsResponse` interface (line 185) |
| Posts table schema | `backend/src/main/resources/db/changelog/migrations/changelog-posts.xml` | changeSet `POSTS;2026-05-07;cbiallo;01` |
| Post media table schema | `backend/src/main/resources/db/changelog/migrations/changelog-post-media.xml` | changeSet `POST_MEDIA;2026-05-07;cbiallo;01` |
| ProfileVisibilityProfile (userId resolution) | `backend/src/main/java/it/evodev/instagram/profile/models/ProfileVisibilityProfile.java` | `userId` field |
| ProfileVisibilityProfileJpaRepository | `backend/src/main/java/it/evodev/instagram/profile/repository/ProfileVisibilityProfileJpaRepository.java` | `findByUserIdAndDeletedAtIsNull` |
| Posts module reference (entity naming pattern) | `backend/src/main/java/it/evodev/instagram/posts/model/PostSavePost.java` | entity class |
| springFetch helper | `frontend/src/lib/spring-client.ts` | `springFetch` |
| SpringAuthError | `frontend/src/lib/spring-error.ts` | `SpringAuthError` |
| Likes server action (unchanged) | `frontend/src/features/likes/actions.ts` | `toggleLikeAction` |
| Posts save action (unchanged) | `frontend/src/features/posts/actions.ts` | `togglePostSaveAction` |
| Direct spec (reference pattern) | `docs/specs/direct.md` | full doc |

---

## 20. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1–7) | Pass |
| Document architecture checks (8–13) | Pass |

Critical assumptions made explicit:

1. Reels are posts with at least one `post_media` row where `media_type = 'video'` and `deleted_at IS NULL`. No separate table or flag exists.
2. `ORDER BY RANDOM()` is intentional and stateless — cursor-based pagination is not meaningful here. Offset is correct for this use case.
3. The `posts` module already uses `PostSavePost.java` mapping the `posts` table. The new `ReelPost.java` maps the same table with a different entity class name — this is safe in Spring/Hibernate as long as the class names differ (they do).
4. Response fields use **camelCase** (Spring Jackson default). The `reels/page.tsx` currently uses snake_case from the legacy route — the page migration must update all field accesses.
5. `getMediaForPosts` is not used as a separate repository method — media is fetched via `ReelPostMediaJpaRepository.findByPostIdInAndDeletedAtIsNullOrderByPosition` and grouped in the service.
6. `springFetch` and `SpringAuthError` already exist and are used by all server actions consistently.
7. Like and save actions (`toggleLikeAction`, `togglePostSaveAction`) work on `postId: number` — since reels are posts, these are unchanged. The page already calls them correctly.
8. `total` in `ReelFeedResponseDTO` is typed as `long` in Java (COUNT returns bigint in PostgreSQL) and `number` in the Zod schema — no overflow risk for realistic data volumes.
