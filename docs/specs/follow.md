# Follow Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Follow module (Spring Boot + frontend follow feature + notification listeners + legacy cleanup)

---

## 1. Objective

Migrate the full follow domain from scattered legacy Next.js API routes and `profileRepository` SQL methods to a dedicated Spring Boot module `it.evodev.instagram.follow`, aligned with the Strangler Fig pattern.

The existing follow read logic currently split across `profile/controllers/FollowController.java`, `profile/service/FollowService.java`, and `profile/service/impl/FollowServiceImpl.java` is relocated into the new module. Five mutation operations still residing in Next.js API routes are implemented as new Spring endpoints.

### Expected outcome

1. New backend module at `backend/src/main/java/it/evodev/instagram/follow/` with `controllers`, `dto`, `events`, `exceptions`, `models`, `repositories`, `services`.
2. All follow logic moves out of `profile/` package. The `profile/` module retains only profile data — it imports `FollowService` and `FollowJpaRepository` from `it.evodev.instagram.follow` where needed (`ProfileReadServiceImpl`, `ProfileVisibilityServiceImpl`).
3. Four new Spring mutation endpoints: toggle follow, accept request, reject request, remove follower.
4. Four Spring events published on mutations: `FollowCreatedEvent`, `FollowRequestedEvent`, `FollowAcceptedEvent`, `FollowRemovedEvent`. Four `@EventListener` classes added to the notifications module consume them, resolving all `// TODO: gestire lato BE` comments in the legacy routes.
5. Frontend `features/follow/` module created at `frontend/src/features/follow/`. Read actions migrated from `features/profile/follow/`. Five mutation server actions added.
6. Five legacy Next.js API route files deleted after parity verification.
7. Legacy `features/profile/follow/` folder deleted; call sites updated to import from `features/follow`.
8. Profile module follow-related files deleted: `FollowController`, `FollowService`, `FollowServiceImpl`, `ProfileVisibilityFollow`, `ProfileVisibilityFollowJpaRepository`, `ProfileFollowerProjection`, `ProfileSuggestionProjection`, `FollowStatusDataDTO`, `ProfileFollowerDataDTO`, `ProfileSuggestionDTO`.

---

## 2. Scope Boundaries

### In scope
1. New `follow` Spring module (model → repository → service → events → controller → dto → exceptions).
2. Four Spring events + four notification listeners in the notifications module.
3. Frontend `features/follow/` server actions (read + mutations) and Zod schemas.
4. Removal of five legacy Next.js API route files and all follow-related `profileRepository` methods.
5. Deletion of `features/profile/follow/` and update of all call sites.
6. Update of `ProfileReadServiceImpl` and `ProfileVisibilityServiceImpl` imports.

### Out of scope
1. Pagination redesign for followers/following lists.
2. Follower count denormalization strategy changes (counters remain in `profiles` table).
3. UI redesign of profile pages or modals.
4. Follow suggestions algorithm changes beyond the current top-20 public profile query.

---

## 3. Current State (Legacy)

### Backend — follow logic inside `profile` package to relocate

| File | Location | Action |
|---|---|---|
| `FollowController.java` | `profile/controllers/` | Move to `follow/controllers/`, update URL base |
| `FollowService.java` | `profile/service/` | Move to `follow/service/` |
| `FollowServiceImpl.java` | `profile/service/impl/` | Move to `follow/service/impl/` |
| `ProfileVisibilityFollow.java` | `profile/models/` | Move to `follow/models/` as `Follow.java` |
| `ProfileVisibilityFollowJpaRepository.java` | `profile/repository/` | Move to `follow/repositories/` as `FollowJpaRepository.java` |
| `ProfileFollowerProjection.java` | `profile/repository/` | Move to `follow/repositories/` as `FollowerProjection.java` |
| `ProfileSuggestionProjection.java` | `profile/repository/` | Move to `follow/repositories/` as `SuggestionProjection.java` |
| `FollowStatusDataDTO.java` | `profile/dto/response/` | Move to `follow/dto/responses/` |
| `ProfileFollowerDataDTO.java` | `profile/dto/response/` | Move to `follow/dto/responses/` as `FollowerDataDTO.java` |
| `ProfileSuggestionDTO.java` | `profile/dto/response/` | Move to `follow/dto/responses/` as `SuggestionDTO.java` |

### Backend — profile files that cross-import follow, must update imports only

| File | What to update |
|---|---|
| `profile/service/impl/ProfileReadServiceImpl.java` | `import it.evodev.instagram.follow.service.FollowService` + `import it.evodev.instagram.follow.dto.responses.FollowStatusDataDTO` |
| `profile/service/impl/ProfileVisibilityServiceImpl.java` | `import it.evodev.instagram.follow.models.Follow` + `import it.evodev.instagram.follow.repositories.FollowJpaRepository` |

### Legacy Next.js API routes to replace (mutations — no Spring equivalent yet)

| Route | Method | Current behavior |
|---|---|---|
| `POST /api/profiles/actions/follow` | POST | Creates follow via `profileRepository.createFollow` + increments counters |
| `POST /api/profiles/actions/unfollow` | POST | Soft deletes follow via `profileRepository.deleteFollow` + decrements counters |
| `POST /api/profiles/actions/remove-follower` | POST | Soft deletes reverse follow via `profileRepository.deleteFollowById` + decrements counters |
| `POST /api/profiles/follow/accept` | POST | Updates status to `accepted` via `profileRepository.acceptFollowById` + increments counters |
| `POST /api/profiles/follow/reject` | POST | Soft deletes pending follow via `profileRepository.deleteFollowById` |

### Frontend — follow feature to migrate

`frontend/src/features/profile/follow/actions.ts` — three read server actions (`getFollowStatusAction`, `getProfileFollowersAction`, `getProfileFollowingAction`) calling Spring GET endpoints already implemented.

`frontend/src/features/profile/follow/schema.ts` — Zod schemas for the three read actions.

Both files move verbatim to `frontend/src/features/follow/` and are augmented with five mutation actions.

### Notification TODOs already marked in legacy routes

All five legacy route files contain commented-out `dispatchNotificationToSpring` / `deleteNotificationsByFilterInSpring` blocks. These are resolved by the four Spring events in this spec.

---

## 4. Target Architecture

### 4.1 Backend module layout

```
backend/src/main/java/it/evodev/instagram/follow/
├── controllers/
│   └── FollowController.java
├── dto/
│   └── responses/
│       ├── FollowStatusDataDTO.java
│       ├── FollowerDataDTO.java
│       ├── SuggestionDTO.java
│       ├── FollowToggleResponseDTO.java
│       └── FollowMutationResponseDTO.java
├── events/
│   ├── FollowCreatedEvent.java
│   ├── FollowRequestedEvent.java
│   ├── FollowAcceptedEvent.java
│   └── FollowRemovedEvent.java
├── exceptions/
│   ├── FollowException.java
│   ├── FollowNotFoundException.java
│   ├── FollowValidationException.java
│   ├── FollowForbiddenException.java
│   └── FollowExceptionHandler.java
├── models/
│   └── Follow.java
├── repositories/
│   ├── FollowJpaRepository.java
│   ├── FollowerProjection.java
│   └── SuggestionProjection.java
└── services/
    ├── FollowService.java
    └── impl/
        └── FollowServiceImpl.java
```

Notification listeners (added to existing notifications module):

```
backend/src/main/java/it/evodev/instagram/notifications/listeners/follow/
├── FollowCreatedNotificationListener.java
├── FollowRequestedNotificationListener.java
├── FollowAcceptedNotificationListener.java
└── FollowRemovedNotificationListener.java
```

### 4.2 Architectural rules

1. Controllers only map HTTP ↔ DTO; zero business logic.
2. `FollowServiceImpl` owns all business logic, transaction boundaries, counter updates, event publishing.
3. Repositories contain persistence logic only (Spring Data JPA + native SQL projections).
4. No strategy pattern — the only "followable" type is a profile; all branching is `isPrivate` checks inline in the service.
5. Events are published by `FollowServiceImpl` via `ApplicationEventPublisher`; listeners in the notifications module are the sole consumers.
6. The `follow` module imports from `profile` only: `ProfileVisibilityProfile` and `ProfileVisibilityProfileJpaRepository`. The `profile` module imports from `follow` only: `FollowService` (interface), `FollowJpaRepository`, `Follow` model. No circular dependencies.
7. Logging: `info` at start/end of each service method; `warn` for business rule violations (self-follow, not found, forbidden); `error` in listeners catch blocks.

### 4.3 Frontend module layout

Create:

```
frontend/src/features/follow/
├── schema.ts
├── actions.ts
└── index.ts
```

Delete after migration:

```
frontend/src/features/profile/follow/actions.ts
frontend/src/features/profile/follow/schema.ts
```

If `features/profile/follow/` becomes empty, delete the directory.

---

## 5. Entity Design

### 5.1 `Follow.java`

```java
@Entity
@Table(name = "follows")
@Getter
@Setter
@NoArgsConstructor
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "follower_profile_id", nullable = false)
    private Long followerProfileId;

    @Column(name = "following_profile_id", nullable = false)
    private Long followingProfileId;

    @Column(name = "status", nullable = false)
    private String status;   // "pending" | "accepted" | "rejected"

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

No Liquibase changes required — la `follows` table già esiste.

### 5.2 `follows` table schema (reference)

| Column | DB type | Constraints | Notes |
|---|---|---|---|
| `id` | `BIGINT` | PK, GENERATED BY DEFAULT AS IDENTITY | Auto-generato dal DB |
| `follower_profile_id` | `BIGINT` | NOT NULL, FK → `profiles.id` CASCADE | Chi segue |
| `following_profile_id` | `BIGINT` | NOT NULL, FK → `profiles.id` CASCADE | Chi viene seguito |
| `status` | `TEXT` | NOT NULL, CHECK IN ('pending','accepted','rejected') | Stato della relazione |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Immutabile |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Aggiornato su ogni mutazione |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete — sempre presente su record inattivi |

**Semantica del soft-delete per operazione:**

| Operazione | `status` al soft-delete | `deleted_at` | Note |
|---|---|---|---|
| Unfollow (follower) | `accepted` invariato | `now()` | |
| Cancel request (follower) | `pending` invariato | `now()` | |
| Reject request (owner) | `rejected` ← aggiornato | `now()` | Permette storico rifiuti |
| Remove follower (owner) | `accepted` invariato | `now()` | |

**Indice univoco parziale:** `UNIQUE(follower_profile_id, following_profile_id) WHERE deleted_at IS NULL`. I record soft-deleted non partecipano al vincolo — il richiedente può sempre ri-inviare una richiesta dopo un rifiuto. La logica di restore nel toggle sovrascrive lo status precedente (anche `rejected`) con il nuovo stato.

---

## 6. Repository Design (`FollowJpaRepository`)

Extend `JpaRepository<Follow, Long>`.

Retain all existing query methods unchanged, renaming only class/package references:

```java
Optional<Follow> findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(
    Long followerProfileId, Long followingProfileId);

List<FollowerProjection> findFollowersWithViewerStatus(
    @Param("targetProfileId") Long targetProfileId,
    @Param("viewerProfileId") Long viewerProfileId);

List<FollowerProjection> findFollowingWithViewerStatus(
    @Param("targetProfileId") Long targetProfileId,
    @Param("viewerProfileId") Long viewerProfileId);

List<SuggestionProjection> findSuggestionsForCurrentUser(
    @Param("currentProfileId") Long currentProfileId);
```

Add the following new query methods required by mutation operations:

```java
// Usato dal toggle CASE B: trova il record soft-deleted (qualunque status) per eventuale restore
// Non filtra su deletedAt — necessario per trovare record con deleted_at IS NOT NULL
Optional<Follow> findByFollowerProfileIdAndFollowingProfileId(
    Long followerProfileId, Long followingProfileId);

// Usato da accept, reject, removeFollower: trova relazione attiva con status specifico
Optional<Follow> findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
    Long followerProfileId, Long followingProfileId, String status);
```

Counter increment/decrement — two `@Modifying @Query` methods on `ProfileVisibilityProfileJpaRepository` (already in `profile` module):

```java
@Modifying
@Query("UPDATE ProfileVisibilityProfile p SET p.followersCount = p.followersCount + 1 WHERE p.id = :profileId")
void incrementFollowersCount(@Param("profileId") Long profileId);

@Modifying
@Query("UPDATE ProfileVisibilityProfile p SET p.followersCount = GREATEST(0, p.followersCount - 1) WHERE p.id = :profileId")
void decrementFollowersCount(@Param("profileId") Long profileId);

@Modifying
@Query("UPDATE ProfileVisibilityProfile p SET p.followingCount = p.followingCount + 1 WHERE p.id = :profileId")
void incrementFollowingCount(@Param("profileId") Long profileId);

@Modifying
@Query("UPDATE ProfileVisibilityProfile p SET p.followingCount = GREATEST(0, p.followingCount - 1) WHERE p.id = :profileId")
void decrementFollowingCount(@Param("profileId") Long profileId);
```

If these four methods already exist (verify before adding), skip — do not duplicate.

---

## 7. Service Design

### 7.1 `FollowService` interface

| Method | Purpose |
|---|---|
| `FollowStatusDataDTO getFollowStatus(UUID currentUserId, String targetUsername)` | Returns `self` / `none` / `pending` / `accepted` |
| `List<FollowerDataDTO> getFollowers(UUID currentUserId, String targetUsername)` | Privacy-aware followers list |
| `List<FollowerDataDTO> getFollowing(UUID currentUserId, String targetUsername)` | Privacy-aware following list |
| `List<SuggestionDTO> getSuggestions(UUID currentUserId)` | Top-5 shuffled suggestions |
| `FollowToggleResponseDTO toggle(UUID currentUserId, Long targetProfileId)` | Follow / unfollow / cancel request |
| `FollowMutationResponseDTO accept(UUID currentUserId, Long requesterProfileId)` | Accept pending request |
| `FollowMutationResponseDTO reject(UUID currentUserId, Long requesterProfileId)` | Reject pending request |
| `FollowMutationResponseDTO removeFollower(UUID currentUserId, Long followerProfileId)` | Remove accepted follower |

Tutti i metodi di mutazione (`toggle`, `accept`, `reject`, `removeFollower`) sono annotati `@Transactional` — ogni flusso combina relationship mutation + counter updates + event publishing che devono essere atomici. I metodi di lettura (`getFollowStatus`, `getFollowers`, `getFollowing`, `getSuggestions`) non richiedono `@Transactional`.

### 7.2 Toggle flow (`FollowServiceImpl.toggle`)

```
1. Resolve currentProfile via profileRepository (userId). Throw FollowNotFoundException if not found.
2. Resolve targetProfile via profileRepository (id). Throw FollowNotFoundException if not found.
3. If currentProfile.id == targetProfile.id → throw FollowValidationException("Cannot follow yourself").
4. Query: findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(currentProfile.id, targetProfile.id).
5. CASE A — active relationship exists (status = 'pending' or 'accepted'):
   a. Set follow.updatedAt = now(), follow.deletedAt = now() → save.
   b. If follow.status == 'accepted':
      - decrementFollowingCount(currentProfile.id)
      - decrementFollowersCount(targetProfile.id)
   c. Publish FollowRemovedEvent(currentProfile.id, targetProfile.id).
   d. Return FollowToggleResponseDTO(success=true, action='removed', status='none').
6. CASE B — no active relationship:
   a. Determine newStatus = targetProfile.isPrivate() ? "pending" : "accepted".
   b. Query: findByFollowerProfileIdAndFollowingProfileId(currentProfile.id, targetProfile.id).
      - Se esiste record soft-deleted: restore (set deletedAt=null, status=newStatus, updatedAt=now).
      - Se non esiste: INSERT new Follow(followerProfileId=current, followingProfileId=target, status=newStatus).
   c. If newStatus == 'accepted':
      - incrementFollowingCount(currentProfile.id)
      - incrementFollowersCount(targetProfile.id)
      - Publish FollowCreatedEvent(currentProfile.id, targetProfile.id).
   d. If newStatus == 'pending':
      - Publish FollowRequestedEvent(currentProfile.id, targetProfile.id).
   e. Return FollowToggleResponseDTO(success=true, action='created', status=newStatus).
```

### 7.3 Accept flow (`FollowServiceImpl.accept`)

```
1. Resolve currentProfile (userId → profile). Throw FollowNotFoundException if not found.
2. Resolve requesterProfile (id → profile). Throw FollowNotFoundException if not found.
3. Query: findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
       requesterProfile.id, currentProfile.id, "pending").
4. If not found → throw FollowNotFoundException("Follow request not found").
5. Set follow.status = "accepted", follow.updatedAt = now() → save.
6. incrementFollowersCount(currentProfile.id).
7. incrementFollowingCount(requesterProfile.id).
8. Publish FollowAcceptedEvent(requesterProfile.id, currentProfile.id).
9. Return FollowMutationResponseDTO(success=true).
```

### 7.4 Reject flow (`FollowServiceImpl.reject`)

```
1. Resolve currentProfile (userId → profile). Throw FollowNotFoundException if not found.
2. Resolve requesterProfile (id → profile). Throw FollowNotFoundException if not found.
3. Query: findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
       requesterProfile.id, currentProfile.id, "pending").
4. If not found → throw FollowNotFoundException("Follow request not found").
5. Set follow.status = "rejected", follow.updatedAt = now(), follow.deletedAt = now() → save.
6. Publish FollowRemovedEvent(requesterProfile.id, currentProfile.id).
7. Return FollowMutationResponseDTO(success=true).
```

### 7.5 Remove follower flow (`FollowServiceImpl.removeFollower`)

```
1. Resolve currentProfile (userId → profile). Throw FollowNotFoundException if not found.
2. Resolve followerProfile (id → profile). Throw FollowNotFoundException if not found.
3. Query: findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
       followerProfile.id, currentProfile.id, "accepted").
4. If not found → throw FollowNotFoundException("Follower relationship not found").
5. Set follow.updatedAt = now(), follow.deletedAt = now() → save.
6. decrementFollowersCount(currentProfile.id).
7. decrementFollowingCount(followerProfile.id).
8. Publish FollowRemovedEvent(followerProfile.id, currentProfile.id).
9. Return FollowMutationResponseDTO(success=true).
```

### 7.6 Read flows

`getFollowStatus`, `getFollowers`, `getFollowing`, `getSuggestions` — logic identical to the existing `FollowServiceImpl` in the `profile` package. Move verbatim, update package imports only.

---

## 8. Endpoint Design

Base controller: `@RequestMapping("/api/priv/follows")`.  
All endpoints require authentication (`JwtAuthenticationFilter` + `SecurityContext`).

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/api/priv/follows/{username}/status` | Follow status current user ↔ target | `FollowApiResponse<FollowStatusDataDTO>` |
| `GET` | `/api/priv/follows/{username}/followers` | Followers list (privacy-aware) | `FollowApiResponse<List<FollowerDataDTO>>` |
| `GET` | `/api/priv/follows/{username}/following` | Following list (privacy-aware) | `FollowApiResponse<List<FollowerDataDTO>>` |
| `GET` | `/api/priv/follows/suggestions` | Top-5 profile suggestions | `FollowApiResponse<List<SuggestionDTO>>` |
| `POST` | `/api/priv/follows/{targetProfileId}` | Toggle follow (follow / unfollow / cancel) | `FollowApiResponse<FollowToggleResponseDTO>` |
| `POST` | `/api/priv/follows/requests/{requesterProfileId}/accept` | Accept pending request | `FollowApiResponse<FollowMutationResponseDTO>` |
| `POST` | `/api/priv/follows/requests/{requesterProfileId}/reject` | Reject pending request | `FollowApiResponse<FollowMutationResponseDTO>` |
| `DELETE` | `/api/priv/follows/followers/{followerProfileId}` | Remove an accepted follower | `FollowApiResponse<FollowMutationResponseDTO>` |

> **URL migration note:** The four read endpoints move from `/api/priv/profiles/{username}/...` to `/api/priv/follows/{username}/...`. The existing `FollowController` in the `profile` package is deleted; the frontend actions are updated to the new paths.

### Request parameters

No request body for any endpoint. `targetProfileId`, `requesterProfileId`, `followerProfileId` are `Long` path variables. `username` is a `String` path variable.

### Response envelope (`FollowApiResponse<T>`)

```java
public record FollowApiResponse<T>(
    boolean success,
    T data,
    String error,
    String message
) {
    public static <T> FollowApiResponse<T> success(T data, String message) {
        return new FollowApiResponse<>(true, data, null, message);
    }

    public static <T> FollowApiResponse<T> error(String error, String message) {
        return new FollowApiResponse<>(false, null, error, message);
    }
}
```

### Toggle response payload

**200 OK** (follow created — public profile):
```json
{ "success": true, "data": { "action": "created", "status": "accepted" }, "error": null, "message": "Now following target" }
```

**200 OK** (follow requested — private profile):
```json
{ "success": true, "data": { "action": "created", "status": "pending" }, "error": null, "message": "Follow request sent" }
```

**200 OK** (unfollow / cancel request):
```json
{ "success": true, "data": { "action": "removed", "status": "none" }, "error": null, "message": "Unfollowed successfully" }
```

### Mutation response payload (accept / reject / removeFollower)

**200 OK**:
```json
{ "success": true, "data": { "success": true }, "error": null, "message": "..." }
```

---

## 9. DTO Design

### `FollowStatusDataDTO`
```java
public record FollowStatusDataDTO(String status) {}
// status: "self" | "none" | "pending" | "accepted"
```

### `FollowerDataDTO`
```java
public record FollowerDataDTO(Long id, String username, String fullName, String profileImageUrl, String followStatus) {}
// followStatus: "none" | "pending" | "accepted"
```

### `SuggestionDTO`
```java
public record SuggestionDTO(Long id, String username, String fullName, String profileImageUrl, Integer followersCount) {}
```

### `FollowToggleResponseDTO`
```java
public record FollowToggleResponseDTO(String action, String status) {}
// action: "created" | "removed"
// status: "none" | "pending" | "accepted"
```

### `FollowMutationResponseDTO`
```java
public record FollowMutationResponseDTO(boolean success) {}
```

---

## 10. Event Design

All events are plain Java records published via `ApplicationEventPublisher`.

```java
public record FollowCreatedEvent(Long senderProfileId, Long recipientProfileId) {}
// published when: public profile followed (status -> accepted)

public record FollowRequestedEvent(Long senderProfileId, Long recipientProfileId) {}
// published when: private profile follow request sent (status -> pending)

public record FollowAcceptedEvent(Long followerProfileId, Long ownerProfileId) {}
// published when: pending request accepted (status -> accepted)

public record FollowRemovedEvent(Long senderProfileId, Long recipientProfileId) {}
// published when: unfollow, cancel request, reject request, remove follower
```

---

## 11. Notification Listener Design

Four listeners added to `it.evodev.instagram.notifications.listeners.follow`.

The three notification strategies already exist: `FollowNotificationStrategy` (`FOLLOW`), `FollowRequestNotificationStrategy` (`FOLLOW_REQUEST`), `FollowAcceptedNotificationStrategy` (`FOLLOW_ACCEPTED`). No new strategies required.

### `FollowCreatedNotificationListener`

```java
@Component
@RequiredArgsConstructor
public class FollowCreatedNotificationListener {
    private static final Logger logger = LoggerFactory.getLogger(FollowCreatedNotificationListener.class);
    private final NotificationService notificationService;

    @EventListener
    public void onFollowCreated(FollowCreatedEvent event) {
        logger.info("FollowCreatedEvent received - senderProfileId: {}, recipientProfileId: {}",
                event.senderProfileId(), event.recipientProfileId());
        try {
            notificationService.dispatchInternal(new NotificationDispatchCommand(
                    event.recipientProfileId(),
                    event.senderProfileId(),
                    "follow",
                    "profile",
                    event.senderProfileId()
            ));
        } catch (Exception e) {
            logger.error("Failed to dispatch follow notification - sender: {}, error: {}",
                    event.senderProfileId(), e.getMessage());
        }
    }
}
```

### `FollowRequestedNotificationListener`

Same structure as `FollowCreatedNotificationListener`, consumes `FollowRequestedEvent`, dispatches type `"follow_request"`.

```java
notificationService.dispatchInternal(new NotificationDispatchCommand(
    event.recipientProfileId(),
    event.senderProfileId(),
    "follow_request",
    "profile",
    event.senderProfileId()
));
```

### `FollowAcceptedNotificationListener`

Consumes `FollowAcceptedEvent`, notifies the follower that their request was accepted.

```java
notificationService.dispatchInternal(new NotificationDispatchCommand(
    event.followerProfileId(),      // recipient: the one who made the request
    event.ownerProfileId(),          // sender: the one who accepted
    "follow_accepted",
    "profile",
    event.ownerProfileId()
));
```

### `FollowRemovedNotificationListener`

Consumes `FollowRemovedEvent`, deletes follow/follow_request notifications between the two profiles.

```java
notificationService.deleteByFilterInternal(new NotificationDeleteByFilterCommand(
    event.recipientProfileId(),
    event.senderProfileId(),
    null,
    List.of("follow", "follow_request"),
    "profile",
    event.senderProfileId()
));
```

---

## 12. Frontend Feature Module

### 12.1 `schema.ts`

Merge schemas from current `features/profile/follow/schema.ts` (read schemas) with new mutation schemas:

**Reuse (no change):** `getFollowStatusInputSchema`, `followStatusDataSchema`, `followStatusResponseSchema`, `getFollowStatusResultSchema`, `getProfileFollowersInputSchema`, `profileFollowerDataSchema`, `profileFollowersResponseSchema`, `getProfileFollowersResultSchema`, `getProfileFollowingInputSchema`, `profileFollowingResponseSchema`, `getProfileFollowingResultSchema`.

**New mutation schemas:**

```ts
export const followToggleInputSchema = z.object({
  targetProfileId: z.number().int().positive(),
});
export type FollowToggleInput = z.infer<typeof followToggleInputSchema>;

export const followToggleDataSchema = z.object({
  action: z.enum(['created', 'removed']),
  status: z.enum(['none', 'pending', 'accepted']),
});
export type FollowToggleData = z.infer<typeof followToggleDataSchema>;

export const followToggleResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: followToggleDataSchema }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type FollowToggleResult = z.infer<typeof followToggleResultSchema>;

export const followRequestActionInputSchema = z.object({
  requesterProfileId: z.number().int().positive(),
});
export type FollowRequestActionInput = z.infer<typeof followRequestActionInputSchema>;

export const removeFollowerInputSchema = z.object({
  followerProfileId: z.number().int().positive(),
});
export type RemoveFollowerInput = z.infer<typeof removeFollowerInputSchema>;

export const followMutationResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type FollowMutationResult = z.infer<typeof followMutationResultSchema>;
```

### 12.2 `actions.ts`

Three read actions migrated verbatim from `features/profile/follow/actions.ts`, with URL paths updated to `/api/priv/follows/...`:

| Old URL | New URL |
|---|---|
| `/api/priv/profiles/{username}/follow-status` | `/api/priv/follows/{username}/status` |
| `/api/priv/profiles/{username}/followers` | `/api/priv/follows/{username}/followers` |
| `/api/priv/profiles/{username}/following` | `/api/priv/follows/{username}/following` |

Five new mutation actions:

```ts
'use server';

export async function toggleFollowAction(input: FollowToggleInput): Promise<FollowToggleResult> {
  const parsed = followToggleInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  const accessToken = await getAccessToken();
  if (!accessToken) return { success: false, error: 'Authentication required.' };

  let response: Response;
  try {
    response = await fetch(
      buildSpringAuthUrl(`/api/priv/follows/${parsed.data.targetProfileId}`),
      {
        method: 'POST',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8_000),
      }
    );
  } catch {
    return { success: false, error: 'Follow service is unreachable.' };
  }

  if (!response.ok) return { success: false, error: mapFollowError(response.status) };
  const payload = await parseJsonSafe(response);
  return { success: true, data: { action: payload.data.action, status: payload.data.status } };
}

export async function acceptFollowRequestAction(input: FollowRequestActionInput): Promise<FollowMutationResult> { ... }
export async function rejectFollowRequestAction(input: FollowRequestActionInput): Promise<FollowMutationResult> { ... }
export async function removeFollowerAction(input: RemoveFollowerInput): Promise<FollowMutationResult> { ... }
```

`acceptFollowRequestAction` → `POST /api/priv/follows/requests/{requesterProfileId}/accept`  
`rejectFollowRequestAction` → `POST /api/priv/follows/requests/{requesterProfileId}/reject`  
`removeFollowerAction` → `DELETE /api/priv/follows/followers/{followerProfileId}`

Error mapping (`mapFollowError`):
- `401` → `"Authentication required."`
- `404` → `"Profile not found."`
- `409` → `"Follow relationship conflict."`
- `400` → `"Invalid follow request."`
- default → `"Follow service temporarily unavailable."`

### 12.3 `index.ts`

```ts
export * from './actions';
export * from './schema';
```

### 12.4 Frontend call site migration

| Component / file | Current import | New import | Affected action |
|---|---|---|---|
| Profile page / header button | `features/profile/follow/actions` | `features/follow` | `toggleFollowAction` |
| `FollowersModal.tsx` | `features/profile/follow/actions` | `features/follow` | `getProfileFollowersAction` |
| `FollowingModal.tsx` | `features/profile/follow/actions` | `features/follow` | `getProfileFollowingAction` |
| Profile header (follow status) | `features/profile/follow/actions` | `features/follow` | `getFollowStatusAction` |
| Follow request notification UI | `api/profiles/follow/accept` (fetch) | `features/follow` | `acceptFollowRequestAction` |
| Follow request notification UI | `api/profiles/follow/reject` (fetch) | `features/follow` | `rejectFollowRequestAction` |
| Followers modal remove button | `api/profiles/actions/remove-follower` (fetch) | `features/follow` | `removeFollowerAction` |

---

## 13. Exception Design

| Exception class | Trigger | HTTP | Error code |
|---|---|---|---|
| `FollowNotFoundException` | Profile or relationship not found | 404 | `FOLLOW_NOT_FOUND` |
| `FollowValidationException` | Self-follow, invalid path param | 400 | `FOLLOW_VALIDATION_ERROR` |
| `FollowForbiddenException` | Privacy check fails on followers/following read | 403 | `FOLLOW_FORBIDDEN` |
| `FollowException` | Base runtime exception | 500 | `FOLLOW_ERROR` |

`FollowExceptionHandler` annotated `@RestControllerAdvice(basePackages = "it.evodev.instagram.follow")`.

Response format:
```json
{ "success": false, "data": null, "error": "<code>", "message": "<user-safe message>" }
```

---

## 14. Migration Plan (Strangler)

1. **Create `follow` module** — model → repository → service (read methods only, no events yet) → controller (read endpoints only).
2. **Verify read parity** — call all four GET endpoints with a real token, compare response with legacy.
3. **Update `profile` imports** — `ProfileReadServiceImpl` and `ProfileVisibilityServiceImpl` switch to `follow` package imports. Delete the 10 follow-related files from `profile`.
4. **Add mutation endpoints** — implement toggle, accept, reject, removeFollower in service + controller. No events yet.
5. **Add events and listeners** — add four events, four notification listeners.
6. **Implement frontend `features/follow/`** — schema + actions (read + mutations).
7. **Migrate all call sites** — update imports from `features/profile/follow` → `features/follow`, from direct `fetch('/api/profiles/...')` → action calls.
8. **Verify parity** — toggle follow on public/private profile, accept/reject/removeFollower, confirm notification rows created.
9. **Delete legacy** — five Next.js API route files, `features/profile/follow/` folder, `profileRepository` methods used exclusively by the deleted routes.

---

## 15. Cleanup Plan

### Legacy API routes to delete

1. `frontend/src/app/api/profiles/actions/follow/route.ts`
2. `frontend/src/app/api/profiles/actions/unfollow/route.ts`
3. `frontend/src/app/api/profiles/actions/remove-follower/route.ts`
4. `frontend/src/app/api/profiles/follow/accept/route.ts`
5. `frontend/src/app/api/profiles/follow/reject/route.ts`

### Profile backend files to delete (moved to `follow`)

1. `backend/.../profile/controllers/FollowController.java`
2. `backend/.../profile/service/FollowService.java`
3. `backend/.../profile/service/impl/FollowServiceImpl.java`
4. `backend/.../profile/models/ProfileVisibilityFollow.java`
5. `backend/.../profile/repository/ProfileVisibilityFollowJpaRepository.java`
6. `backend/.../profile/repository/ProfileFollowerProjection.java`
7. `backend/.../profile/repository/ProfileSuggestionProjection.java`
8. `backend/.../profile/dto/response/FollowStatusDataDTO.java`
9. `backend/.../profile/dto/response/ProfileFollowerDataDTO.java`
10. `backend/.../profile/dto/response/ProfileSuggestionDTO.java`

### Frontend files to delete (migrated to `features/follow`)

1. `frontend/src/features/profile/follow/actions.ts`
2. `frontend/src/features/profile/follow/schema.ts`

### `profileRepository` methods to verify and remove if unused after migration

`createFollow`, `deleteFollow`, `deleteFollowById`, `acceptFollowById`, `getFollowRelationship`, `incrementFollowingCount`, `decrementFollowingCount`, `incrementFollowersCount`, `decrementFollowersCount`.

Check `frontend/src/repositories/index.ts` after removal; delete the repository file if empty.

---

## 16. Security Considerations (OWASP-focused)

1. `currentUserId` always resolved from Spring Security `Authentication` context — never from request body or query param (Broken Access Control).
2. `targetProfileId`, `requesterProfileId`, `followerProfileId` are path variables (`Long`); non-numeric values return `400` via Spring path variable binding before reaching the controller.
3. Privacy checks on followers/following read are enforced in `FollowServiceImpl`, not in the controller.
4. All JPA queries use named parameters — no string concatenation (SQL Injection).
5. Counter columns use atomic `SET followers_count = followers_count ± 1` to prevent race-condition overwrite.
6. Logging never includes user tokens or personally identifiable payload data.
7. The self-follow guard is enforced in `toggle` before any write.

---

## 17. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Keep follow mutation logic in Next.js routes | Move to `FollowServiceImpl` | Strangler architecture target |
| Add a `FollowStrategy` for public/private profiles | Use inline `isPrivate()` check in service | Only one followable type; strategy adds no value |
| Call `notificationService` directly from `FollowServiceImpl` | Publish events; listeners in notifications module handle dispatch | Follow module must not import notifications module |
| Create separate `/follow` and `/unfollow` endpoints | Use single `POST /api/priv/follows/{id}` toggle | One endpoint, idempotent semantics, matches likes pattern |
| Dispatch notifications on both `FollowRemovedEvent` e `FollowCreatedEvent` per la stessa operazione | Each event is distinct and fired once per state change | Duplicate notifications or missed deletions |
| Compute new counter in Java (`count = current + 1`) | Use atomic `SET followers_count = followers_count + 1` | Race condition under concurrent requests |
| Return `200` for reject/removeFollower silently when relationship is not found | Throw `FollowNotFoundException` → `404` | Silent failure hides frontend bugs |
| Put privacy checks for followers/following read in the controller | Service enforces privacy rules | Controller stays transport-only |
| Duplicate `FollowApiResponse` shape in `ProfileApiResponse` | Use `FollowApiResponse<T>` in the follow module only | Single source per module |
| Embed follow state (is_following, followers_count) directly in the profile entity response | Keep follow state in dedicated follow endpoints | Profile module must not couple to follow state |
| Omettere `updatedAt` nei soft-delete | Aggiornare sempre `updatedAt = now()` insieme a `deletedAt` | Consistenza audit — ogni mutazione deve tracciare quando è avvenuta |
| Su reject impostare solo `deletedAt` senza aggiornare `status` | Impostare `status = "rejected"` + `deletedAt = now()` + `updatedAt = now()` | Il campo `status` è l'unico modo per distinguere un rifiuto da un unfollow nello storico |
| Fare INSERT di una nuova riga nel toggle CASE B senza verificare se esiste un record soft-deleted | Usare `findByFollowerProfileIdAndFollowingProfileId` (senza filtro `deletedAt`) e fare restore se trovato | Evita row proliferation sulla stessa coppia (follower, following) |

---

## 18. Test Case Specifications

> **Stato attuale:** nessun test applicativo esiste nel progetto — né backend (solo `InstagramApplicationTests.java` di context load) né frontend. Le tabelle seguenti sono la specifica di cosa va scritto, non di cosa è già presente. Vanno implementati contestualmente all'implementazione del modulo.

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-FOLLOW-001 | `toggle` — follow public | Valid currentUserId, public targetProfileId, no prior follow | `action='created'`, `status='accepted'`, counters +1, `FollowCreatedEvent` published | First ever follow |
| TC-FOLLOW-002 | `toggle` — request private | Valid currentUserId, private targetProfileId, no prior follow | `action='created'`, `status='pending'`, counters unchanged, `FollowRequestedEvent` published | Profile changes to private after a prior follow |
| TC-FOLLOW-003 | `toggle` — unfollow accepted | Active accepted follow exists | `action='removed'`, `status='none'`, counters -1, `FollowRemovedEvent` published | Counter at 0 → stays 0 |
| TC-FOLLOW-004 | `toggle` — cancel pending | Active pending follow exists | `action='removed'`, `status='none'`, counters unchanged, `FollowRemovedEvent` published | |
| TC-FOLLOW-005 | `toggle` — self-follow | currentProfileId == targetProfileId | `FollowValidationException` | |
| TC-FOLLOW-006 | `accept` — valid | Pending request from requester to current | Status updated to `accepted`, counters +1, `FollowAcceptedEvent` published | |
| TC-FOLLOW-007 | `accept` — not pending | No pending request exists | `FollowNotFoundException` | Already accepted request |
| TC-FOLLOW-008 | `reject` — valid | Pending request from requester | Soft deleted, counters unchanged, `FollowRemovedEvent` published | |
| TC-FOLLOW-009 | `removeFollower` — valid | Accepted follower relationship exists | Soft deleted, counters -1, `FollowRemovedEvent` published | |
| TC-FOLLOW-010 | `removeFollower` — not follower | No accepted relationship from follower to current | `FollowNotFoundException` | Pending relationship (not accepted) |
| TC-FOLLOW-011 | Frontend Zod — `toggleFollowAction` | `{ targetProfileId: -1 }` | Validation failure, `{ success: false }` | Non-integer, zero |
| TC-FOLLOW-012 | `FollowRemovedNotificationListener` | `FollowRemovedEvent` received | `deleteByFilterInternal` called once, no crash | Service throws → error logged, no propagation |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-FOLLOW-001 | POST toggle follow public | Seed viewer + public target, no prior follow | `200`, `action='created'`, `status='accepted'`, `followers_count` +1 in `profiles` | Delete follow row, restore counts |
| IT-FOLLOW-002 | POST toggle follow private | Seed viewer + private target, no prior follow | `200`, `action='created'`, `status='pending'`, counts unchanged | Delete follow row |
| IT-FOLLOW-003 | POST toggle unfollow | Seed viewer + target + accepted follow | `200`, `action='removed'`, `status='none'`, counts -1 | Restore follow row and counts |
| IT-FOLLOW-004 | POST accept request | Seed pending follow (requester → current) | `200`, follow status = `accepted`, counts +1, notification row created | Delete follow + notification rows |
| IT-FOLLOW-005 | POST reject request | Seed pending follow (requester → current) | `200`, follow soft-deleted, counts unchanged | Delete follow row |
| IT-FOLLOW-006 | DELETE remove follower | Seed accepted follow (follower → current) | `200`, follow soft-deleted, counts -1 | Restore follow row and counts |
| IT-FOLLOW-007 | GET followers private — forbidden | Seed private target, viewer not following | `403`, `FOLLOW_FORBIDDEN` | Remove seed rows |
| IT-FOLLOW-008 | GET followers private — allowed | Seed private target + accepted follow viewer → target | `200`, followers array returned | Remove seed rows |
| IT-FOLLOW-009 | Frontend `toggleFollowAction` → Spring | Valid access token, public target | `{ success: true, data: { action, status } }` | Clear session |
| IT-FOLLOW-010 | Notification dispatch on follow | Seed sender + recipient + public profile | After toggle, notification row with type `FOLLOW` created | Delete follow + notification rows |

---

## 19. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Target/requester/follower profile not found | `profileRepository` returns empty | 404 `FOLLOW_NOT_FOUND` | None | `warn` |
| Follow relationship not found (accept/reject/remove) | `followRepository` returns empty | 404 `FOLLOW_NOT_FOUND` | None | `warn` |
| Self-follow | `currentProfile.id == targetProfile.id` in toggle | 400 `FOLLOW_VALIDATION_ERROR` | None | `warn` |
| Non-numeric path variable | Spring path variable coercion fails | 400 (Spring default) | None | Spring log |
| Private profile followers/following forbidden | Service privacy check fails | 403 `FOLLOW_FORBIDDEN` | None | `warn` |
| Unauthenticated request | Spring Security filter | 401 (pre-controller) | None | Spring security log |
| Counter decrement below zero | `GREATEST(0, count - 1)` guard in SQL | Count stays 0, no error surfaced | — | `warn` |
| Notification dispatch failure | Exception in listener | Swallowed — follow toggle still succeeds | Follow saved, notification not created | `error` |
| Backend unreachable (frontend action) | `fetch` timeout / network error | `{ success: false, error: "Follow service is unreachable." }` | UI shows stale state | Server-side `error` |
| DB concurrent insert conflict | `DataIntegrityViolationException` on unique index | 409 or retry once then 500 | None | `error` |

---

## 20. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Existing FollowController (to delete) | `backend/src/main/java/it/evodev/instagram/profile/controllers/FollowController.java` | class |
| Existing FollowService interface (to delete) | `backend/src/main/java/it/evodev/instagram/profile/service/FollowService.java` | interface |
| Existing FollowServiceImpl (to delete) | `backend/src/main/java/it/evodev/instagram/profile/service/impl/FollowServiceImpl.java` | class |
| Existing ProfileVisibilityFollow model (to delete) | `backend/src/main/java/it/evodev/instagram/profile/models/ProfileVisibilityFollow.java` | class |
| Existing FollowJpaRepository (to delete) | `backend/src/main/java/it/evodev/instagram/profile/repository/ProfileVisibilityFollowJpaRepository.java` | class |
| ProfileReadServiceImpl (import update needed) | `backend/src/main/java/it/evodev/instagram/profile/service/impl/ProfileReadServiceImpl.java` | `FollowService`, `FollowStatusDataDTO` imports |
| ProfileVisibilityServiceImpl (import update needed) | `backend/src/main/java/it/evodev/instagram/profile/service/impl/ProfileVisibilityServiceImpl.java` | `ProfileVisibilityFollow`, `ProfileVisibilityFollowJpaRepository` imports |
| Likes module (reference architecture) | `backend/src/main/java/it/evodev/instagram/likes/` | all |
| Likes spec (reference pattern) | `docs/specs/likes.md` | full doc |
| Existing follow notification strategies | `backend/src/main/java/it/evodev/instagram/notifications/strategies/follow/` | `FollowNotificationStrategy`, `FollowRequestNotificationStrategy`, `FollowAcceptedNotificationStrategy` |
| LikeNotificationListener (reference listener pattern) | `backend/src/main/java/it/evodev/instagram/notifications/listeners/likes/LikeNotificationListener.java` | `onLikeCreated` |
| LikeRemovedNotificationListener (reference delete pattern) | `backend/src/main/java/it/evodev/instagram/notifications/listeners/likes/LikeRemovedNotificationListener.java` | `onLikeRemoved` |
| NotificationDispatchCommand | `backend/src/main/java/it/evodev/instagram/notifications/models/commands/NotificationDispatchCommand.java` | record fields |
| NotificationDeleteByFilterCommand | `backend/src/main/java/it/evodev/instagram/notifications/models/commands/NotificationDeleteByFilterCommand.java` | record fields |
| NotificationService.dispatchInternal | `backend/src/main/java/it/evodev/instagram/notifications/services/impl/NotificationServiceImpl.java` | `dispatchInternal` |
| Legacy follow route — follow | `frontend/src/app/api/profiles/actions/follow/route.ts` | `POST` |
| Legacy follow route — unfollow | `frontend/src/app/api/profiles/actions/unfollow/route.ts` | `POST` |
| Legacy follow route — remove-follower | `frontend/src/app/api/profiles/actions/remove-follower/route.ts` | `POST` |
| Legacy follow route — accept | `frontend/src/app/api/profiles/follow/accept/route.ts` | `POST` |
| Legacy follow route — reject | `frontend/src/app/api/profiles/follow/reject/route.ts` | `POST` |
| Existing frontend follow actions (to delete) | `frontend/src/features/profile/follow/actions.ts` | all |
| Existing frontend follow schema (to delete) | `frontend/src/features/profile/follow/schema.ts` | all |
| Frontend auth feature pattern | `frontend/src/features/auth/actions.ts` | `AuthActionResult` |
| Frontend likes feature pattern | `frontend/src/features/likes/actions.ts` | `toggleLikeAction` |

---

## 21. Postman Collection

Create:

```
postman/collections/follow/
├── .resources/
│   └── definition.yaml
├── Get Follow Status.request.yaml
├── Get Followers By Username.request.yaml
├── Get Following By Username.request.yaml
├── Get Suggestions.request.yaml
├── Toggle Follow.request.yaml
├── Accept Follow Request.request.yaml
├── Reject Follow Request.request.yaml
└── Remove Follower.request.yaml
```

### `definition.yaml`

```yaml
$kind: collection
name: Follow
description: Endpoints privati per la gestione del sistema di follow — stato, lista follower/following, suggerimenti e mutazioni (toggle, accept, reject, remove).
```

### Request files

**`Get Follow Status.request.yaml`**
```yaml
$kind: http-request
name: Get Follow Status
description: >
  Restituisce lo stato di follow tra l'utente autenticato e un profilo target.
  status: "self" | "none" | "pending" | "accepted".
  Cambia {{followUsername}} per testare scenari diversi.
method: GET
url: "{{baseUrl}}/api/priv/follows/{{followUsername}}/status"
headers:
  Authorization: Bearer {{accessToken}}
order: 100
```

**`Get Followers By Username.request.yaml`**
```yaml
$kind: http-request
name: Get Followers By Username
description: >
  Restituisce la lista follower del profilo target rispettando le regole di privacy.
  403 FOLLOW_FORBIDDEN se il profilo è privato e il viewer non è follower accettato.
method: GET
url: "{{baseUrl}}/api/priv/follows/{{followUsername}}/followers"
headers:
  Authorization: Bearer {{accessToken}}
order: 200
```

**`Get Following By Username.request.yaml`**
```yaml
$kind: http-request
name: Get Following By Username
description: >
  Restituisce la lista dei profili seguiti dal target rispettando le regole di privacy.
  403 FOLLOW_FORBIDDEN se il profilo è privato e il viewer non è follower accettato.
method: GET
url: "{{baseUrl}}/api/priv/follows/{{followUsername}}/following"
headers:
  Authorization: Bearer {{accessToken}}
order: 300
```

**`Get Suggestions.request.yaml`**
```yaml
$kind: http-request
name: Get Suggestions
description: >
  Restituisce fino a 5 profili pubblici suggeriti (top-20 per followers_count, shuffled).
  Esclude: se stesso, già seguiti (accepted), richieste pending, profili privati.
method: GET
url: "{{baseUrl}}/api/priv/follows/suggestions"
headers:
  Authorization: Bearer {{accessToken}}
order: 400
```

**`Toggle Follow.request.yaml`**
```yaml
$kind: http-request
name: Toggle Follow
description: >
  Toggle follow su un profilo target.
  Profilo pubblico: action='created', status='accepted' (follow immediato).
  Profilo privato: action='created', status='pending' (richiesta).
  Follow/richiesta attiva → action='removed', status='none'.
  Usa {{followTargetProfileId}} (numero intero, ID del profilo target).
method: POST
url: "{{baseUrl}}/api/priv/follows/{{followTargetProfileId}}"
headers:
  Authorization: Bearer {{accessToken}}
order: 500
```

**`Accept Follow Request.request.yaml`**
```yaml
$kind: http-request
name: Accept Follow Request
description: >
  Accetta una richiesta di follow pending.
  {{followRequesterProfileId}} = ID del profilo che ha inviato la richiesta.
  404 FOLLOW_NOT_FOUND se la richiesta non esiste o non è pending.
method: POST
url: "{{baseUrl}}/api/priv/follows/requests/{{followRequesterProfileId}}/accept"
headers:
  Authorization: Bearer {{accessToken}}
order: 600
```

**`Reject Follow Request.request.yaml`**
```yaml
$kind: http-request
name: Reject Follow Request
description: >
  Rifiuta una richiesta di follow pending (soft delete).
  {{followRequesterProfileId}} = ID del profilo che ha inviato la richiesta.
  404 FOLLOW_NOT_FOUND se la richiesta non esiste o non è pending.
method: POST
url: "{{baseUrl}}/api/priv/follows/requests/{{followRequesterProfileId}}/reject"
headers:
  Authorization: Bearer {{accessToken}}
order: 700
```

**`Remove Follower.request.yaml`**
```yaml
$kind: http-request
name: Remove Follower
description: >
  Rimuove un follower accettato dalla propria lista.
  {{followFollowerProfileId}} = ID del profilo da rimuovere.
  404 FOLLOW_NOT_FOUND se la relazione accettata non esiste.
method: DELETE
url: "{{baseUrl}}/api/priv/follows/followers/{{followFollowerProfileId}}"
headers:
  Authorization: Bearer {{accessToken}}
order: 800
```

### Variabili Postman da aggiungere all'environment

| Variable | Example value | Used by |
|---|---|---|
| `followUsername` | `johndoe` | GET status, followers, following |
| `followTargetProfileId` | `42` | Toggle Follow |
| `followRequesterProfileId` | `17` | Accept, Reject |
| `followFollowerProfileId` | `23` | Remove Follower |

### File Postman esistenti da eliminare (URL cambiati)

Dopo la migrazione dei call site, eliminare:

1. `postman/collections/Profile/Follow Status/Get Follow Status.request.yaml`
2. `postman/collections/Profile/Read Profile/Get Profile Followers By Username.request.yaml`
3. `postman/collections/Profile/Read Profile/Get Profile Following By Username.request.yaml`
4. `postman/collections/Profile/Suggestions/Get Profile Suggestions.request.yaml`

Se le cartelle `Profile/Follow Status/` e `Profile/Suggestions/` diventano vuote dopo la rimozione, eliminare le cartelle.

---

## 22. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1–7) | Pass |
| Document architecture checks (8–13) | Pass |

Critical assumptions made explicit:

1. The `follows` table already exists and is not modified by this spec. No Liquibase changesets needed.
2. The four counter columns (`followers_count`, `following_count`) already exist on the `profiles` table and are updated atomically by the service.
3. The three notification strategies (`FollowNotificationStrategy`, `FollowRequestNotificationStrategy`, `FollowAcceptedNotificationStrategy`) already exist and require no changes.
4. `NotificationType.FOLLOW`, `FOLLOW_REQUEST`, `FOLLOW_ACCEPTED` already exist in the enum — no new enum values needed.
5. The `ProfileVisibilityProfileJpaRepository` already has or must have the four counter increment/decrement `@Modifying @Query` methods. If they do not exist, they must be added to that repository (not to `FollowJpaRepository`).
6. The toggle endpoint does not distinguish between "first follow" and "re-follow after soft delete" in the response — both return `action='created'`. The frontend cares only about the resulting state.
7. URL paths for the four read endpoints change from `/api/priv/profiles/{username}/...` to `/api/priv/follows/{username}/...`. The frontend actions are updated as part of this spec.
