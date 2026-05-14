# Likes Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Likes module (Spring Boot + frontend likes feature + Postman + legacy cleanup)

## 1. Objective

Migrate the full likes domain from three separate legacy Next.js API routes and repository SQL methods to a single Spring Boot module `it.evodev.instagram.likes`, backed by a unified polymorphic `likes` table. Frontend components are rewired to a single server action; legacy routes, repository methods, and the three split Liquibase changelog files are removed.

### Expected outcome
1. Three legacy Liquibase changelog files (`changelog-post-likes.xml`, `changelog-comment-likes.xml`, `changelog-story-likes.xml`) are deleted from the repository. A single `changelog-likes.xml` replaces them with the polymorphic schema.
2. `changelog-dev-seed.xml` changesets `004-dev-seed-post-likes-saved` and `004-dev-seed-comments` (inline `comment_likes` section) are replaced by a single `004-dev-seed-likes` changeset that seeds all like types into the new `likes` table.
3. New backend module at `backend/src/main/java/it/evodev/instagram/likes/` with `controllers`, `dto`, `events`, `exceptions`, `models`, `repositories`, `services`, `strategies`.
4. Toggle logic from `PostRepository`, `CommentRepository`, `StoryRepository` (Next.js) moves to `LikeServiceImpl` + strategy classes.
5. On every new like, a `LikeCreatedEvent` is published and consumed by an `@EventListener` in the notifications module, which dispatches the correct notification using already-existing `LikePostNotificationStrategy`, `LikeCommentNotificationStrategy`, `LikeStoryNotificationStrategy`.
6. Frontend exposes `toggleLikeAction` in `frontend/src/features/likes/`. All seven call sites in components and pages are updated to use this action.
7. Five legacy Next.js API route files and all like-related repository methods are deleted after parity is verified.
8. Postman collection added at `postman/collections/likes/`.

## 2. Scope Boundaries

### In scope
1. Liquibase: delete three changelog files, create `changelog-likes.xml`, update dev seed.
2. Backend likes module (model → controller → service → repository → dto/exceptions → strategy).
3. Spring `ApplicationEvent` bridge from likes to notifications (listener only — notification strategies already exist).
4. Frontend `features/likes/` server action and Zod schema.
5. Migration of all seven frontend call sites from legacy route fetch to `toggleLikeAction`.
6. Removal of five legacy Next route files and all like-related repository methods.

### Out of scope
1. Embedding `is_liked_by_current_user` in post/comment/story entity responses — that belongs to future post/comment/story Spring migration.
2. UI redesign of feed, reels, explore, or profile pages.
3. Story likes activity tracking beyond the toggle count.
4. Likes for entity types beyond `post`, `comment`, `story`.

## 3. Current State Extraction (Legacy)

### Legacy API routes to replace
| Legacy route | Method | Current behavior |
|---|---|---|
| `POST /api/feed/like` | `POST` | Toggle post like, reads from `post_likes` via `PostRepository.hasLiked/like/unlike` |
| `POST /api/posts/[postId]/like` | `POST` | Duplicate toggle for post like (same logic, different route) |
| `GET /api/posts/[postId]/is-liked` | `GET` | Orphaned status check — no active caller, safe to delete |
| `POST /api/feed/comments/like` | `POST` | Toggle comment like via `CommentRepository.hasLiked/like/unlike` |
| `POST /api/stories/[id]/like` | `POST` | Toggle story like via `StoryRepository.hasLiked/likeStory` |

### Legacy repository responsibilities to migrate
`frontend/src/repositories/PostRepository.ts`:
- `hasLiked(postId, profileId)` — existence check on `post_likes`
- `like(postId, profileId)` — insert/re-activate on `post_likes`
- `unlike(postId, profileId)` — soft delete on `post_likes`

`frontend/src/repositories/CommentRepository.ts`:
- `hasLiked(commentId, profileId)` — existence check on `comment_likes`
- `like(commentId, profileId)` — insert on `comment_likes`
- `unlike(commentId, profileId)` — delete from `comment_likes`

`frontend/src/repositories/StoryRepository.ts`:
- `hasLiked(storyId, profileId)` — existence check on `story_likes`
- `likeStory(storyId, profileId)` — toggle on `story_likes`, returns `boolean`

### Notification TODOs already marked in legacy code
All four legacy route files contain commented-out `dispatchNotificationToSpring` / `deleteNotificationsByFilterInSpring` blocks. These are resolved by the `LikeCreatedEvent` mechanism in this spec.

## 4. Target Architecture

### 4.1 Backend module layout

Create:
```
backend/src/main/java/it/evodev/instagram/likes/
├── controllers/
│   └── LikesController.java
├── dto/
│   └── responses/
│       └── LikeToggleResponseDTO.java
├── events/
│   └── LikeCreatedEvent.java
├── exceptions/
│   ├── LikeException.java
│   ├── LikeableNotFoundException.java
│   ├── LikeValidationException.java
│   └── LikesExceptionHandler.java
├── models/
│   ├── Like.java
│   └── enums/
│       ├── LikeableType.java
│       └── LikeableTypeConverter.java
├── repositories/
│   └── LikeRepository.java
├── services/
│   ├── LikeService.java
│   └── impl/
│       └── LikeServiceImpl.java
└── strategies/
    ├── LikeStrategy.java
    ├── LikeStrategyRegistry.java
    ├── comment/
    │   └── CommentLikeStrategy.java
    ├── post/
    │   └── PostLikeStrategy.java
    └── story/
        └── StoryLikeStrategy.java
```

Notification listener (added to existing notifications module):
```
backend/src/main/java/it/evodev/instagram/notifications/
└── listeners/
    └── LikeNotificationListener.java
```

### Architectural rules
1. Controllers only map HTTP ↔ DTO and delegate to services. Zero business logic in controller body.
2. Services own business logic, transaction boundaries, event publishing.
3. Repositories contain persistence logic only (Spring Data JPA).
4. Strategy implementations validate that the `likeable_id` exists in the correct table. No type branching in service.
5. `LikeCreatedEvent` is published by service; the listener in the notifications module is the only consumer.
6. Logging follows auth conventions: `info` start/end, `warn` anomalies (self-like guard, not found), `error` caught exceptions without sensitive data.

### 4.2 Frontend module layout

Create:
```
frontend/src/features/likes/
├── schema.ts
├── actions.ts
└── index.ts
```

## 5. Database Specification

### 5.1 Liquibase changelog changes

**Delete** these three files entirely (no rollback, no versioning — never reached production):
- `backend/src/main/resources/db/changelog/migrations/changelog-post-likes.xml`
- `backend/src/main/resources/db/changelog/migrations/changelog-comment-likes.xml`
- `backend/src/main/resources/db/changelog/migrations/changelog-story-likes.xml`

**Create** `backend/src/main/resources/db/changelog/migrations/changelog-likes.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="LIKES;2026-05-14;cbiallo;01" author="cbiallo">
        <sql>
            CREATE TABLE likes (
                id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                profile_id    BIGINT       NOT NULL,
                likeable_type VARCHAR(20)  NOT NULL
                                  CHECK (likeable_type IN ('post', 'comment', 'story')),
                likeable_id   BIGINT       NOT NULL,
                created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                deleted_at    TIMESTAMPTZ,

                CONSTRAINT LIKES_PROFILE_FK FOREIGN KEY (profile_id)
                    REFERENCES profiles(id) ON DELETE CASCADE
            );

            CREATE UNIQUE INDEX idx_likes_unique_active
                ON likes(profile_id, likeable_type, likeable_id)
                WHERE deleted_at IS NULL;

            CREATE INDEX idx_likes_profile
                ON likes(profile_id)
                WHERE deleted_at IS NULL;

            CREATE INDEX idx_likes_content
                ON likes(likeable_type, likeable_id)
                WHERE deleted_at IS NULL;
        </sql>
        <rollback>
            DROP TABLE likes;
        </rollback>
    </changeSet>

</databaseChangeLog>
```

**Update master changelog** to remove references to the three deleted files and add `changelog-likes.xml` in their place. The include order must respect FK dependencies: `likes` depends on `profiles`, `posts`, `comments`, `stories`.

### 5.2 Dev seed changes

**Replace** changeset `004-dev-seed-post-likes-saved` and the `comment_likes` portion of changeset `004-dev-seed-comments` with a new unified changeset `004-dev-seed-likes`.

The new changeset inserts into `likes` for all three types:

```sql
-- Post likes (35% probability, access-gated by privacy)
INSERT INTO likes (profile_id, likeable_type, likeable_id)
SELECT profile_rec.id, 'post', post_rec.id
FROM posts post_rec
JOIN profiles pr ON post_rec.profile_id = pr.id
CROSS JOIN profiles profile_rec
WHERE post_rec.deleted_at IS NULL
  AND (
    NOT pr.is_private
    OR post_rec.profile_id = profile_rec.id
    OR EXISTS (
        SELECT 1 FROM follows
        WHERE follower_profile_id  = profile_rec.id
          AND following_profile_id = post_rec.profile_id
          AND status               = 'accepted'
          AND deleted_at IS NULL)
  )
  AND random() < 0.35
ON CONFLICT DO NOTHING;

-- Update posts.likes_count from actual likes
UPDATE posts p SET likes_count = (
    SELECT COUNT(*) FROM likes
    WHERE likeable_type = 'post' AND likeable_id = p.id AND deleted_at IS NULL);

-- Comment likes (8% probability)
INSERT INTO likes (profile_id, likeable_type, likeable_id)
SELECT profile_rec.id, 'comment', comment_rec.id
FROM comments comment_rec
CROSS JOIN profiles profile_rec
WHERE random() < 0.08
ON CONFLICT DO NOTHING;

-- Update comments.likes_count
UPDATE comments c SET likes_count = (
    SELECT COUNT(*) FROM likes
    WHERE likeable_type = 'comment' AND likeable_id = c.id AND deleted_at IS NULL);

-- Story likes (20% probability, only followers or owner)
INSERT INTO likes (profile_id, likeable_type, likeable_id)
SELECT profile_rec.id, 'story', story_rec.id
FROM stories story_rec
CROSS JOIN profiles profile_rec
WHERE (
    story_rec.profile_id = profile_rec.id
    OR EXISTS (
        SELECT 1 FROM follows
        WHERE follower_profile_id  = profile_rec.id
          AND following_profile_id = story_rec.profile_id
          AND status               = 'accepted'
          AND deleted_at IS NULL)
  )
  AND random() < 0.20
ON CONFLICT DO NOTHING;
```

The `saved_posts` seeding remains in a separate changeset `004-dev-seed-saved-posts` (extracted from the original `004-dev-seed-post-likes-saved`).

Rollback for `004-dev-seed-likes`:
```sql
DELETE FROM likes;
UPDATE posts SET likes_count = 0;
UPDATE comments SET likes_count = 0;
```

### 5.3 Entity design: `likes` table

| Column | DB type | Constraints | Notes |
|---|---|---|---|
| `id` | `BIGINT` | PK, identity | Auto-generated |
| `profile_id` | `BIGINT` | NOT NULL, FK → `profiles.id` CASCADE | Actor who liked |
| `likeable_type` | `VARCHAR(20)` | NOT NULL, CHECK IN ('post','comment','story') | Polymorphic discriminator |
| `likeable_id` | `BIGINT` | NOT NULL | Target entity ID, no DB FK (polymorphic) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Immutable creation time |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete = unlike; re-like sets to NULL |

No DB-level FK on `likeable_id` — referential integrity enforced by strategy validation at application level.

## 6. Entity Design (Java)

### 6.1 `Like.java`

```java
@Entity
@Table(name = "likes")
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Enumerated(EnumType.STRING)
    @Column(name = "likeable_type", nullable = false, length = 20)
    @Convert(converter = LikeableTypeConverter.class)
    private LikeableType likeableType;

    @Column(name = "likeable_id", nullable = false)
    private Long likeableId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
```

### 6.2 `LikeableType` enum

Values: `POST`, `COMMENT`, `STORY`.  
`LikeableTypeConverter` maps `POST` ↔ `"post"`, `COMMENT` ↔ `"comment"`, `STORY` ↔ `"story"` for JPA persistence and path param parsing.

## 7. Strategy Pattern Design

### 7.1 `LikeStrategy` interface

```java
public interface LikeStrategy {
    LikeableType supportedType();
    void validateExists(Long likeableId);       // throws LikeableNotFoundException if not found
    Long resolveAuthorProfileId(Long likeableId); // returns the owner's profile_id (for self-like guard)
}
```

### 7.2 Strategy implementations

| Class | `supportedType()` | `validateExists` | `resolveAuthorProfileId` |
|---|---|---|---|
| `PostLikeStrategy` | `POST` | Queries `posts` table by id | Returns `posts.profile_id` |
| `CommentLikeStrategy` | `COMMENT` | Queries `comments` table by id | Returns `comments.profile_id` |
| `StoryLikeStrategy` | `STORY` | Queries `stories` table by id + checks `deleted_at IS NULL` | Returns `stories.profile_id` |

### 7.3 `LikeStrategyRegistry`

`EnumMap<LikeableType, LikeStrategy>` populated via constructor DI from `List<LikeStrategy>`. Resolves by `LikeableType`. Throws `LikeValidationException` if type is unknown.

## 8. Service Design and Flow

### 8.1 Public service surface (`LikeService` interface)

| Method | Purpose |
|---|---|
| `LikeToggleResponseDTO toggle(Long profileId, LikeableType type, Long likeableId)` | Toggle like state |

### 8.2 Toggle flow (`LikeServiceImpl`)

```
1. Resolve strategy from registry by LikeableType.
2. Call strategy.validateExists(likeableId) → throws LikeableNotFoundException if not found.
3. Query LikeRepository for existing record (any deleted_at state).
4. CASE A — active like exists (deleted_at IS NULL):
   a. Set deleted_at = NOW() → save (soft delete = unlike).
   b. Decrement count via SQL: UPDATE {table} SET likes_count = likes_count - 1 WHERE id = likeableId.
   c. Do NOT publish event.
   d. Return { liked: false, count: new count }.
5. CASE B — no record OR soft-deleted record exists:
   a. If record exists → set deleted_at = NULL, updated_at = NOW() (re-activation).
   b. If no record → INSERT new Like.
   c. Increment count via SQL: UPDATE {table} SET likes_count = likes_count + 1 WHERE id = likeableId.
   d. Self-like guard: call strategy.resolveAuthorProfileId(likeableId). If authorProfileId == profileId → skip event publish.
   e. Otherwise: publish LikeCreatedEvent via ApplicationEventPublisher.
   f. Return { liked: true, count: new count }.
6. Log info at start (profileId, type, likeableId) and end (liked state, count).
```

The count retrieval after update is a single `SELECT likes_count FROM {table} WHERE id = likeableId` within the same transaction.

## 9. Event Design

### 9.1 `LikeCreatedEvent`

```java
public record LikeCreatedEvent(
    Long senderProfileId,
    Long recipientProfileId,
    LikeableType likeableType,
    Long likeableId
) {}
```

Published via `ApplicationEventPublisher.publishEvent(new LikeCreatedEvent(...))`.

### 9.2 `LikeNotificationListener` (notifications module)

```java
@Component
public class LikeNotificationListener {

    @EventListener
    public void onLikeCreated(LikeCreatedEvent event) {
        String type = switch (event.likeableType()) {
            case POST    -> "like_post";
            case COMMENT -> "like_comment";
            case STORY   -> "like_story";
        };
        String referenceType = event.likeableType().name().toLowerCase();

        notificationService.dispatch(new NotificationDispatchCommand(
            event.recipientProfileId(),
            event.senderProfileId(),
            type,
            referenceType,
            event.likeableId()
        ));
    }
}
```

The `NotificationDispatchCommand` record already exists. The `NotificationService.dispatch` already handles strategy lookup, self-notification guard (second guard — belt-and-suspenders), deduplication, and persistence.

## 10. Endpoint Design

Base controller: `@RequestMapping("/api/priv/likes")`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/priv/likes/{likeableType}/{likeableId}` | Required | Toggle like on any entity |

`{likeableType}` path variable is coerced to `LikeableType` enum by `LikeableTypeConverter`. Invalid values → `400` via exception handler.

### Request
No request body. Auth profile is resolved from Spring Security context.

### Response payload
**200 OK**
```json
{
  "success": true,
  "liked": true,
  "count": 142
}
```

`count` is the updated `likes_count` of the target entity after the toggle.

## 11. Repository Design (`LikeRepository`)

Extend `JpaRepository<Like, Long>`.

Required query methods:

```java
Optional<Like> findByProfileIdAndLikeableTypeAndLikeableId(
    Long profileId, LikeableType type, Long likeableId);

long countByLikeableTypeAndLikeableIdAndDeletedAtIsNull(
    LikeableType type, Long likeableId);
```

Count queries are informational only — authoritative `likes_count` lives in entity tables (`posts.likes_count`, `comments.likes_count`) and is updated via `@Modifying @Query` in each entity's repository.

Increment/decrement are `@Modifying @Query` named-param updates in their respective entity repositories (PostRepository, CommentRepository — Spring module versions, not the legacy Next.js ones). StoryLikeStrategy uses the stories JPA repository equivalently.

## 12. DTO Design

### `LikeToggleResponseDTO`
```java
public record LikeToggleResponseDTO(
    boolean success,
    boolean liked,
    long count
) {}
```

No request DTO — all input comes from the authenticated profile (Security context) and path variables.

## 13. Exception Design

| Exception class | Trigger | HTTP | Error code |
|---|---|---|---|
| `LikeableNotFoundException` | Entity not found in strategy.validateExists | 404 | `LIKEABLE_NOT_FOUND` |
| `LikeValidationException` | Invalid `likeableType` path param | 400 | `LIKE_VALIDATION_ERROR` |
| `LikeException` | Base runtime exception | 500 | `LIKE_ERROR` |

`LikesExceptionHandler` is annotated `@RestControllerAdvice(basePackages = "it.evodev.instagram.likes")`. Returns `{ success: false, error: "<code>", message: "<user-safe message>", timestamp: "<ISO>" }`.

## 14. Frontend Feature Module

### 14.1 `schema.ts`

```ts
import { z } from "zod";

export const likeableTypeSchema = z.enum(["post", "comment", "story"]);
export type LikeableType = z.infer<typeof likeableTypeSchema>;

export const toggleLikeInputSchema = z.object({
  likeableType: likeableTypeSchema,
  likeableId: z.number().int().positive(),
});
export type ToggleLikeInput = z.infer<typeof toggleLikeInputSchema>;

export type LikeToggleData = {
  liked: boolean;
  count: number;
};

export type LikesActionResult<T> = { success: true; data: T } | { success: false; error: string };
```

### 14.2 `actions.ts` — `toggleLikeAction`

```ts
"use server";

export async function toggleLikeAction(
  input: ToggleLikeInput
): Promise<LikesActionResult<LikeToggleData>> {
  const parsed = toggleLikeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid like input." };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: "Missing access token." };

  const { likeableType, likeableId } = parsed.data;

  let response: Response;
  try {
    response = await fetch(
      buildSpringAuthUrl(`/api/priv/likes/${likeableType}/${likeableId}`),
      {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      }
    );
  } catch {
    return { success: false, error: "Likes service is unreachable." };
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    return { success: false, error: mapLikeError(response.status) };
  }

  return {
    success: true,
    data: { liked: payload.liked, count: payload.count },
  };
}
```

Error mapping (`mapLikeError`):
- `401` → `"Authentication required."`
- `404` → `"Content not found."`
- `400` → `"Invalid like request."`
- default → `"Likes service temporarily unavailable."`

### 14.3 `index.ts`

```ts
export * from "./actions";
export * from "./schema";
```

### 14.4 Frontend call site migration

Every call site listed below currently does a `fetch('/api/...')` to a legacy route. Replace with:

```ts
import { toggleLikeAction } from "@/features/likes";

const result = await toggleLikeAction({ likeableType: "post", likeableId: postId });
if (result.success) {
  setIsLiked(result.data.liked);
  setLikesCount(result.data.count);
}
```

| File | Current fetch target | `likeableType` to pass |
|---|---|---|
| `frontend/src/components/feed/Post.tsx` | `/api/feed/like` or `/api/posts/[id]/like` | `"post"` |
| `frontend/src/components/feed/PostModal.tsx` | `/api/posts/[id]/like` | `"post"` |
| `frontend/src/components/feed/FeedContainer.tsx` | `/api/feed/like` | `"post"` |
| `frontend/src/components/feed/StoryViewer.tsx` | `/api/stories/[id]/like` | `"story"` |
| `frontend/src/app/(main)/reels/page.tsx` | `/api/posts/[id]/like` (post) + `/api/feed/comments/like` | `"post"` / `"comment"` |
| `frontend/src/app/(main)/explore/page.tsx` | `/api/posts/[id]/like` | `"post"` |
| `frontend/src/app/(main)/(profile)/profile/[username]/page.tsx` | `/api/posts/[id]/like` | `"post"` |

The response shape `{ liked, count }` is already mapped correctly from the backend DTO. The `is_liked_by_current_user` boolean in each component's local state is set from `result.data.liked`; `likes_count` is set from `result.data.count`.

## 15. Postman Integration

Create:
```
postman/collections/likes/
├── .resources/
│   └── definition.yaml
└── Toggle Like.request.yaml
```

`definition.yaml` follows the same format as `postman/collections/notifications/.resources/definition.yaml`.

`Toggle Like.request.yaml`:
- Method: `POST`
- URL: `{{baseUrl}}/api/priv/likes/{{likeableType}}/{{likeableId}}`
- Auth: Bearer `{{accessToken}}`
- No request body
- Variables: `likeableType` ∈ `post | comment | story`, `likeableId` = integer
- Success response example: `{ "success": true, "liked": true, "count": 42 }`
- Error response example: `{ "success": false, "error": "LIKEABLE_NOT_FOUND", "message": "Content not found.", "timestamp": "..." }`

## 16. Migration Plan (Strangler)

1. Delete `changelog-post-likes.xml`, `changelog-comment-likes.xml`, `changelog-story-likes.xml` from repository.
2. Create `changelog-likes.xml` and update master changelog include order.
3. Update `changelog-dev-seed.xml`: replace `004-dev-seed-post-likes-saved` and the `comment_likes` section of `004-dev-seed-comments` with `004-dev-seed-likes` + `004-dev-seed-saved-posts`.
4. Implement backend `likes` module (entity → repository → strategies → service → event → controller → exceptions).
5. Add `LikeNotificationListener` to notifications module.
6. Implement frontend `features/likes/` (`schema.ts`, `actions.ts`, `index.ts`).
7. Migrate all seven call sites to use `toggleLikeAction`.
8. Verify parity: toggle post/comment/story like in dev, confirm `liked` and `count` responses are correct, confirm notification is dispatched.
9. Delete legacy routes and repository methods (see Section 17).
10. Add Postman collection.

## 17. Cleanup Plan

Remove after parity confirmation:

### Legacy API routes
1. `frontend/src/app/api/feed/like/route.ts`
2. `frontend/src/app/api/feed/comments/like/route.ts`
3. `frontend/src/app/api/posts/[postId]/like/route.ts`
4. `frontend/src/app/api/posts/[postId]/is-liked/route.ts`
5. `frontend/src/app/api/stories/[id]/like/route.ts`

### Legacy repository methods
From `frontend/src/repositories/PostRepository.ts`: `hasLiked`, `like`, `unlike`  
From `frontend/src/repositories/CommentRepository.ts`: `hasLiked`, `like`, `unlike`  
From `frontend/src/repositories/StoryRepository.ts`: `hasLiked`, `likeStory`

If any repository becomes empty after removal, delete the entire repository file. Update `frontend/src/repositories/index.ts` accordingly.

## 18. Security Considerations (OWASP-focused)

1. `profileId` is always resolved from the authenticated Spring Security context — never from request body or query param (Broken Access Control).
2. `likeableId` is validated to exist via strategy before any write (prevents writing dangling likes to non-existent entities).
3. All JPA queries use named parameters — no string concatenation (SQL Injection).
4. `LikeableType` coercion rejects unlisted values at controller boundary (Input Validation).
5. Logging never includes profile tokens or personally identifiable payload data (Sensitive Data Exposure).
6. Count fields are updated via `SET likes_count = likes_count ± 1` to prevent race-condition overwrite, not by computing a new total from the application layer.

## 19. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Keep toggle logic in Next.js repository methods | Move to `LikeServiceImpl` + strategies | Strangler architecture target |
| Use a switch/case tree on `LikeableType` in service | Use `LikeStrategyRegistry.resolve(type)` | SRP; adding new types requires zero service changes |
| Create a separate `POST /api/priv/likes/post`, `/api/priv/likes/comment`, `/api/priv/likes/story` | Use single `/api/priv/likes/{likeableType}/{likeableId}` | One controller, one action, strategy resolves the type |
| Call notification service directly from `LikeServiceImpl` | Publish `LikeCreatedEvent` and handle in listener | Decoupling; likes module must not import notification module |
| Dispatch notification on unlike (removal) | Publish event only on new like | Notification removal on unlike is not a product requirement and was explicitly excluded |
| Compute new count in application layer (`count = current + 1`) | Use DB atomic `UPDATE ... SET likes_count = likes_count + 1` | Race condition under concurrent requests |
| Read `likes_count` before the update to return it | Re-query after the update within the same transaction | Stale read under concurrent writes |
| Use `List<Like>` query then `count()` in Java | Use `@Query` count projection directly | N+1 and unnecessary hydration |
| Add a GET `/api/priv/likes/{type}/{id}` status endpoint | Embed `is_liked_by_current_user` in entity fetch (future post/comment/story module migration) | No existing caller; confirmed orphaned in legacy code |
| Modify the three old changelog files with new changesets | Delete old files, create `changelog-likes.xml` | Old changesets reference tables that no longer exist; versioning broken schemas is harmful |

## 20. Test Case Specifications

### Unit tests required
| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-LIKE-001 | Strategy registry | `LikeableType.POST` | Resolves `PostLikeStrategy` | Unknown type → `LikeValidationException` |
| TC-LIKE-002 | `PostLikeStrategy.validateExists` | Non-existent `postId` | `LikeableNotFoundException` | Soft-deleted post |
| TC-LIKE-003 | `LikeServiceImpl.toggle` — new like | Valid profileId + postId, no prior like | Returns `{ liked: true, count: n+1 }`, event published | First ever like on entity |
| TC-LIKE-004 | `LikeServiceImpl.toggle` — unlike | Active like exists | Returns `{ liked: false, count: n-1 }`, no event published | Count already 0 → capped at 0 |
| TC-LIKE-005 | `LikeServiceImpl.toggle` — re-like | Soft-deleted like exists | Reactivates (sets `deleted_at = NULL`), returns `{ liked: true }`, event published | Multiple re-like cycles |
| TC-LIKE-006 | Self-like guard | `profileId == authorProfileId` | Like persisted, `count` incremented, event NOT published | All three entity types |
| TC-LIKE-007 | Frontend Zod schema | `{ likeableType: "invalid", likeableId: 1 }` | Validation failure, returns `{ success: false }` | Negative/zero `likeableId` |
| TC-LIKE-008 | `LikeableTypeConverter` | Path param `"story"` | Converts to `LikeableType.STORY` | Case mismatch `"STORY"` → `400` |

### Integration tests required
| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-LIKE-001 | Toggle post like (new) | Seed profile + post, no prior like | `200`, `liked: true`, `count` incremented in `posts` table | Delete like row, restore count |
| IT-LIKE-002 | Toggle post like (remove) | Seed profile + post + active like row | `200`, `liked: false`, `count` decremented | Restore like row and count |
| IT-LIKE-003 | Toggle comment like | Seed profile + comment, no prior like | `200`, `liked: true`, `count` incremented in `comments` table | Delete like row, restore count |
| IT-LIKE-004 | Toggle story like | Seed profile + active story, no prior like | `200`, `liked: true` | Delete like row |
| IT-LIKE-005 | Notification event dispatched | Seed sender + recipient + post | After toggle, notification row created with `LIKE_POST` type | Delete like + notification rows |
| IT-LIKE-006 | Invalid `likeableType` path param | Any valid auth token | `400` with `LIKE_VALIDATION_ERROR` | None |
| IT-LIKE-007 | Non-existent `likeableId` | Valid auth, valid type, non-existent id | `404` with `LIKEABLE_NOT_FOUND` | None |
| IT-LIKE-008 | Frontend action → Spring toggle | Valid access token in cookies | `toggleLikeAction` returns `{ success: true, data: { liked, count } }` | Clear cookies/session |

## 21. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Invalid `likeableType` path param | `LikeableTypeConverter` throws | `400` `LIKE_VALIDATION_ERROR` | None | `warn` |
| Entity not found | `strategy.validateExists` throws `LikeableNotFoundException` | `404` `LIKEABLE_NOT_FOUND` | None | `warn` |
| Unauthenticated request | Spring Security filter | `401` (pre-controller) | None | Spring security log |
| DB write conflict (concurrent toggle) | `DataIntegrityViolationException` on unique index | `409` or retry once then `500` | None | `error` |
| Count decrement below zero | SQL `GREATEST(0, likes_count - 1)` guard | Count stays 0, no error surfaced | — | `warn` |
| Notification dispatch failure | Exception in `LikeNotificationListener` | Swallowed — like toggle still succeeds | Like saved, notification not created | `error` |
| Backend unreachable (frontend action) | `fetch` timeout / network error | `{ success: false, error: "Likes service is unreachable." }` | UI shows stale state | Server-side `error` |
| `400` from backend (frontend action) | Non-`ok` response | `{ success: false, error: "Invalid like request." }` | UI shows stale state | None |

## 22. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Legacy post like route (feed) | `frontend/src/app/api/feed/like/route.ts` | `POST` |
| Legacy post like route (post detail) | `frontend/src/app/api/posts/[postId]/like/route.ts` | `POST` |
| Orphaned is-liked route | `frontend/src/app/api/posts/[postId]/is-liked/route.ts` | `GET` |
| Legacy comment like route | `frontend/src/app/api/feed/comments/like/route.ts` | `POST` |
| Legacy story like route | `frontend/src/app/api/stories/[id]/like/route.ts` | `POST` |
| Legacy PostRepository like methods | `frontend/src/repositories/PostRepository.ts` | `hasLiked`, `like`, `unlike` |
| Legacy CommentRepository like methods | `frontend/src/repositories/CommentRepository.ts` | `hasLiked`, `like`, `unlike` |
| Legacy StoryRepository like methods | `frontend/src/repositories/StoryRepository.ts` | `hasLiked`, `likeStory` |
| Existing like notification strategies | `backend/src/main/java/it/evodev/instagram/notifications/strategies/like/` | `LikePostNotificationStrategy`, `LikeCommentNotificationStrategy`, `LikeStoryNotificationStrategy` |
| Notification dispatch command | `backend/src/main/java/it/evodev/instagram/notifications/models/commands/NotificationDispatchCommand.java` | record fields |
| Notification service dispatch method | `backend/src/main/java/it/evodev/instagram/notifications/services/impl/NotificationServiceImpl.java` | `dispatch` |
| Notification strategy registry pattern | `backend/src/main/java/it/evodev/instagram/notifications/strategies/NotificationStrategyRegistry.java` | `resolve` |
| Auth controller logging style | `backend/src/main/java/it/evodev/instagram/auth/controllers/PrivateAuthController.java` | `logger.info(...)` |
| Auth exception handler style | `backend/src/main/java/it/evodev/instagram/auth/exceptions/AuthExceptionHandler.java` | `@RestControllerAdvice` |
| Frontend auth feature pattern | `frontend/src/features/auth/actions.ts` | `AuthActionResult` |
| Frontend notifications feature pattern | `frontend/src/features/notifications/actions.ts` | `callNotificationsApi` |
| Dev seed file to update | `backend/src/main/resources/db/changelog/seed/changelog-dev-seed.xml` | `004-dev-seed-post-likes-saved`, `004-dev-seed-comments` |
| Master changelog | `backend/src/main/resources/db/changelog/db.changelog-master.xml` | `<include>` blocks |

## 23. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1-7) | Pass |
| Document architecture checks (8-13) | Pass |

Critical assumptions are explicit:
1. The three old changelog files have never been applied to any environment — they are deleted, not migrated. If an environment already ran them, a DROP + CREATE migration changeset would be needed instead.
2. `is_liked_by_current_user` embedded in entity responses is explicitly out of scope — it belongs to the future post/comment/story Spring module migrations.
3. Notification on unlike is not dispatched and no notification cleanup is performed — confirmed product decision.
4. `likes_count` counter columns in `posts`, `comments` tables are the authoritative count source. The `likes` table count is derived on demand only for validation (TC-LIKE integration tests).
5. The `StoryLikeStrategy.validateExists` also checks `stories.deleted_at IS NULL` — unlike post/comment strategies — because stories expire and a like on an expired story must return `404`.
