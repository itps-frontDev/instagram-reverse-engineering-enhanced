# Notifications Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.0  
**Scope:** Notifications module (Spring Boot + frontend notifications feature + Postman + legacy cleanup)

## 1. Objective

Migrate the full notifications domain from legacy Next.js API routes and repository SQL to a dedicated Spring Boot module `it.evodev.instagram.notifications`, keeping frontend focused on UI and server actions, and aligning architecture, logging, and error handling with the `auth` module conventions.

### Expected outcome
1. New backend module under `backend/src/main/java/it/evodev/instagram/notifications` with `config`, `controllers`, `dto`, `exceptions`, `models`, `repositories`, `services`, `strategies`, `util`.
2. Notification flows currently in `frontend/src/repositories/NotificationRepository.ts` are migrated to Spring services/repositories using JPA and strategy-based orchestration.
3. Frontend notification access/mutations are moved to `frontend/src/features/notifications` (`schema.ts`, `actions.ts`, `index.ts`) with typed `{ success, data?, error? }` responses.
4. Legacy Next routes under `frontend/src/app/api/notifications/**` and legacy repository code are removed after backend parity is verified.
5. Postman collections for private notification endpoints are added under `postman/collections/notifications`.

## 2. Scope Boundaries

### In scope
1. Backend notifications module (model -> controller -> service -> repository -> dto/exceptions -> strategy pattern).
2. Liquibase changesets for notification schema alignment and constraints required by Spring module.
3. Frontend feature module for notifications server actions and Zod schema validation.
4. Migration of existing notification read/count/mark-read behaviors and creation flows currently embedded in frontend repository helpers.
5. Cleanup of legacy Next notification API routes and repository code.

### Out of scope
1. Rework of unrelated non-notification modules unless required to wire notification dispatch calls.
2. UI redesign of notification pages/components.
3. Non-notification database refactors not needed for this migration.

## 3. Current State Extraction (Legacy)

### Legacy API routes to replace
| Legacy route | Method | Current behavior |
|---|---|---|
| `/api/notifications` | `GET` | Returns notification list in legacy payload shape |
| `/api/notifications/unread-count` | `GET` | Returns unread count for navbar badge |
| `/api/notifications/mark-read` | `PATCH` | Marks all recipient notifications as read |

### Legacy repository responsibilities
`frontend/src/repositories/NotificationRepository.ts` currently contains:
1. Data access SQL (read, count, mark-read, delete).
2. Domain orchestration (deduplication, self-notification guard).
3. Notification-type-specific creators (`createLikeNotification`, `createCommentNotification`, `createFollowRequestNotification`, etc.).
4. Type branching logic (`deleteLikeNotification` with manual `if/else` mapping).

This is the logic that must move into Spring Boot service + strategy components.

## 4. Target Architecture

## 4.1 Backend module layout

Create:
```
backend/src/main/java/it/evodev/instagram/notifications/
├── config/
├── controllers/
├── dto/
├── exceptions/
├── models/
├── repositories/
├── services/
├── strategies/
└── util/
```

### Architectural rules
1. Controllers only map HTTP <-> DTO and delegate to services.
2. Services contain business logic and transaction boundaries.
3. Repositories contain persistence logic only (Spring Data JPA + named query params where needed).
4. Strategy implementations encapsulate notification-type-specific rules (no giant switch/case in services).
5. Logging follows auth conventions: `info` start/end, `warn` anomalies, `error` exceptions with `e.getMessage()` and no sensitive data.

## 4.2 Frontend module layout

Create:
```
frontend/src/features/notifications/
├── schema.ts
├── actions.ts
└── index.ts
```

`actions.ts` is used to keep parity with existing `frontend/src/features/auth/actions.ts` convention.

## 5. Entity Design

## 5.1 Notification entity
| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK, non-null | UUID primary key for migrated module |
| `recipientProfileId` | `Long` | non-null, indexed | Legacy schema-compatible recipient reference |
| `senderProfileId` | `Long` | non-null, indexed | Actor profile reference |
| `type` | `NotificationType` enum | non-null | Enum mapped as `STRING` |
| `referenceType` | `NotificationReferenceType` enum | nullable | `post`, `comment`, `story`, `profile`, `message` |
| `referenceId` | `Long` | nullable | Generic domain target id |
| `isRead` | `Boolean` | non-null, default `false` | Read status |
| `createdAt` | `LocalDateTime` | non-null | `@CreatedDate` |
| `updatedAt` | `LocalDateTime` | non-null | `@LastModifiedDate` |
| `deletedAt` | `LocalDateTime` | nullable | Soft delete support if enabled by migration decision |

## 5.2 Enums
`NotificationType` must include:
1. `LIKE_POST`
2. `LIKE_COMMENT`
3. `LIKE_STORY`
4. `COMMENT`
5. `COMMENT_REPLY`
6. `FOLLOW`
7. `FOLLOW_REQUEST`
8. `FOLLOW_ACCEPTED`
9. `MENTION_POST`
10. `MENTION_COMMENT`
11. `MENTION_STORY`
12. `TAG`
13. `MESSAGE`
14. `STORY_VIEW`

Mapping from external payload (`like_post`) to enum must be centralized in `util` mapper, not duplicated.

## 6. Strategy Pattern Design

## 6.1 Core contracts
1. `NotificationStrategy` interface in `strategies` package.
2. One concrete strategy per notification type.
3. `NotificationStrategyRegistry` (or factory) resolves strategy by `NotificationType`.
4. `NotificationDispatchService` orchestrates validation, deduplication, persistence, and logging.

### `NotificationStrategy` required methods
| Method | Purpose |
|---|---|
| `NotificationType supportedType()` | Declares ownership of one type |
| `void validate(NotificationContext context)` | Type-specific business guards |
| `NotificationBuildResult build(NotificationContext context)` | Produces normalized persistence payload |

## 6.2 Strategy implementations
Create dedicated classes:
1. `LikePostNotificationStrategy`
2. `LikeCommentNotificationStrategy`
3. `LikeStoryNotificationStrategy`
4. `CommentNotificationStrategy`
5. `CommentReplyNotificationStrategy`
6. `FollowNotificationStrategy`
7. `FollowRequestNotificationStrategy`
8. `FollowAcceptedNotificationStrategy`
9. `MentionPostNotificationStrategy`
10. `MentionCommentNotificationStrategy`
11. `MentionStoryNotificationStrategy`
12. `TagNotificationStrategy`
13. `MessageNotificationStrategy`
14. `StoryViewNotificationStrategy`

### Non-negotiable rule
No switch-case trees for notification-type behavior in controller or service. Type branching is allowed only in strategy registry construction.

## 7. Service Design and Flow

## 7.1 Public service surface
| Service method | Purpose |
|---|---|
| `listForRecipient(authSubjectUuid, limit, cursor)` | Notification feed read |
| `countUnread(authSubjectUuid)` | Badge count |
| `markAllAsRead(authSubjectUuid)` | Bulk read mutation |
| `markAsRead(authSubjectUuid, notificationUuid)` | Single read mutation |
| `delete(authSubjectUuid, notificationUuid)` | Recipient-owned delete |
| `dispatch(NotificationCreateRequestDTO request)` | Create via strategy |

## 7.2 Read flow
1. Resolve authenticated user from Spring Security context.
2. Resolve recipient profile ownership safely.
3. Query notifications ordered by `createdAt desc`.
4. Return DTO list with actor metadata and reference preview metadata.
5. Log `info` start/end with recipient id and result count.

## 7.3 Dispatch flow (strategy orchestration)
1. Normalize payload (`type`, references, ids).
2. Reject self-notification (`recipient == sender`) with `warn` and no insert.
3. Resolve strategy from registry.
4. Execute strategy validation/build.
5. Apply deduplication policy (existing recent duplicate within configurable TTL).
6. Persist entity in transaction.
7. Return created DTO.

## 8. Endpoint Design (Private, Security-Compatible)

Base controller: `@RequestMapping("/api/priv/notifications")`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/priv/notifications` | Required | List recipient notifications |
| `GET` | `/api/priv/notifications/unread-count` | Required | Read unread badge count |
| `PATCH` | `/api/priv/notifications/read-all` | Required | Mark all recipient notifications as read |
| `PATCH` | `/api/priv/notifications/{notificationUuid}/read` | Required | Mark one notification as read |
| `DELETE` | `/api/priv/notifications/{notificationUuid}` | Required | Delete one notification (owned only) |
| `POST` | `/api/priv/notifications/dispatch` | Internal/private auth | Create notification via strategy orchestration |

Each controller method must use DTO request/response and no business logic in controller body.

## 9. DTO Design

## 9.1 Request DTOs
1. `NotificationListRequestDTO` (`limit`, `cursor`).
2. `NotificationDispatchRequestDTO` (`recipientProfileId`, `senderProfileId`, `type`, `referenceType`, `referenceId`, metadata fields).
3. `MarkNotificationReadRequestDTO` (if body-based variant is used).

## 9.2 Response DTOs
1. `NotificationResponseDTO` (full notification row + actor/reference projection).
2. `NotificationListResponseDTO` (`items`, `nextCursor`, `unreadCountSnapshot` optional).
3. `UnreadCountResponseDTO` (`count`).
4. `NotificationMutationResponseDTO` (`success`, `updatedCount` or `message`).
5. `NotificationErrorDTO` aligned with auth error DTO shape (`code`, `message`, `timestamp`).

## 10. Repository Design

1. Extend `JpaRepository<Notification, UUID>`.
2. Provide explicit query methods for common reads (`findByRecipientProfileId...`, `countByRecipientProfileIdAndIsReadFalse...`).
3. Use custom `@Query` only when projection joins are required.
4. Use named parameters only; never SQL string concatenation.
5. Include ownership-safe methods (`findByIdAndRecipientProfileId...`) to prevent IDOR.

## 11. Validation Strategy

## 11.1 Backend validation
1. Bean Validation (`@NotNull`, `@NotBlank`, `@Positive`, size constraints).
2. Enum coercion with explicit invalid-type error mapping.
3. Reference consistency checks in strategy classes (example: `LIKE_COMMENT` requires `referenceType=comment` and non-null `referenceId`).

## 11.2 Frontend validation
`frontend/src/features/notifications/schema.ts` must define:
1. `notificationTypeSchema` with all supported values.
2. `notificationReferenceTypeSchema`.
3. Request schemas per action (list, mark read, delete).
4. Response schemas matching backend DTO names.
5. Generic `notificationsActionResultSchema<T>` equivalent to auth feature pattern.

## 12. Error Handling Strategy

1. Add custom exceptions in `notifications.exceptions`:
   - `NotificationNotFoundException`
   - `NotificationAccessDeniedException`
   - `NotificationValidationException`
   - `NotificationStrategyNotFoundException`
   - `NotificationDispatchException`
2. Add `NotificationsExceptionHandler` with `@RestControllerAdvice(basePackages = "it.evodev.instagram.notifications")`.
3. Always log handled exceptions with `logger.error(...)` before response.
4. Return structured response format compatible with project conventions: `{ success, data?, error?, message? }` with stable error code mapping.
5. Never expose stack traces or internal class names in client payload.

## 13. Frontend Integration

## 13.1 `actions.ts` required actions
| Action | Backend target | Return type |
|---|---|---|
| `getNotificationsAction(input)` | `GET /api/priv/notifications` | `NotificationsActionResult<NotificationListData>` |
| `getUnreadCountAction()` | `GET /api/priv/notifications/unread-count` | `NotificationsActionResult<{ count: number }>` |
| `markAllNotificationsReadAction()` | `PATCH /api/priv/notifications/read-all` | `NotificationsActionResult<{ updatedCount: number }>` |
| `markNotificationReadAction(input)` | `PATCH /api/priv/notifications/{notificationUuid}/read` | `NotificationsActionResult<{ success: boolean }>` |
| `deleteNotificationAction(input)` | `DELETE /api/priv/notifications/{notificationUuid}` | `NotificationsActionResult<{ success: boolean }>` |

### Action rules
1. Read access token from cookies and inject `Authorization: Bearer ...`.
2. `cache: "no-store"` for mutations.
3. Revalidate notification tag(s) after successful mutations.
4. Map backend status/error code to stable frontend user-safe error strings.

## 13.2 `index.ts`
Re-export all schemas and actions:
```ts
export * from "./actions";
export * from "./schema";
```

## 14. Postman Integration

Create:
```
postman/collections/notifications/
├── .resources/
│   └── definition.yaml
├── List Notifications.request.yaml
├── Unread Count.request.yaml
├── Mark All Read.request.yaml
├── Mark Read.request.yaml
├── Delete Notification.request.yaml
└── Dispatch Notification.request.yaml
```

Each request file must include:
1. Example request body/params.
2. Success response example.
3. Error response example.
4. JWT auth header where required.

## 15. Migration Plan (Strangler)

1. Implement backend notifications module and Liquibase changes.
2. Add frontend notifications feature (`schema.ts`, `actions.ts`, `index.ts`) and wire to Spring endpoints.
3. Replace notification calls in pages/components to use feature actions instead of Next API routes.
4. Migrate all notification creation entry points from legacy repository helper methods to Spring dispatch endpoint/service integration.
5. Verify parity in staging with old and new outputs on key flows.
6. Remove legacy layer in one atomic module commit.
7. Update `reports/api_routes.csv` to reflect removed/added routes.

## 16. Cleanup Plan

Remove after parity confirmation:
1. `frontend/src/app/api/notifications/route.ts`
2. `frontend/src/app/api/notifications/unread-count/route.ts`
3. `frontend/src/app/api/notifications/mark-read/route.ts`
4. `frontend/src/repositories/NotificationRepository.ts`
5. Any remaining direct imports/usages of `notificationRepository`.

## 17. Security Considerations (OWASP-focused)

1. Enforce ownership check for all read/update/delete operations (Broken Access Control, IDOR).
2. Never trust client-provided recipient identity; derive from authenticated user context where applicable.
3. Use JPA parameterized queries only (SQL Injection protection).
4. Do not log tokens, personal secrets, or full payloads with sensitive fields (Sensitive Data Exposure).
5. Validate enum/type and reference combinations strictly to avoid malformed dispatch abuse.

## 18. Anti-Patterns (DO NOT)

| ❌ Don’t | ✅ Do instead | Why |
|---|---|---|
| Keep notification business logic in Next repository | Move logic to Spring service + strategies | Strangler architecture target |
| Use switch-case for 14 notification types in service | Use strategy registry/factory | Extensibility and SRP |
| Expose numeric ids in new frontend contracts | Use UUID path/query parameters for migrated endpoints | Migration rule and IDOR reduction |
| Return raw exception stack traces | Map to structured error DTO | Stable API and security |
| Build SQL strings dynamically | Use Spring Data query methods / named params | Injection and maintainability |
| Skip ownership checks on mutations | Always filter by recipient + id | Broken access control prevention |
| Log full request payloads with user data | Log minimal operational metadata | Privacy and compliance |
| Duplicate validation in many layers inconsistently | Define clear Zod + Bean Validation contracts | Predictable error behavior |

## 19. Test Case Specifications

### Unit tests required
| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-NOTIF-001 | Strategy registry | Known type `LIKE_POST` | Resolves `LikePostNotificationStrategy` | Unknown type throws strategy-not-found |
| TC-NOTIF-002 | Dispatch service | Sender == recipient | No insert, controlled skip result | All notification types |
| TC-NOTIF-003 | Deduplication policy | Duplicate event within TTL | No duplicate persisted | TTL boundary timestamp |
| TC-NOTIF-004 | Mark-all-read service | Recipient with mixed read state | Only unread updated | Empty list |
| TC-NOTIF-005 | Frontend Zod schema | Invalid UUID/type | Validation failure | Missing optional fields |

### Integration tests required
| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-NOTIF-001 | List notifications endpoint | Seed recipient + sender + references | `200` with ordered DTO list | Remove seeded rows |
| IT-NOTIF-002 | Mark all read endpoint | Seed unread notifications | `200` and count updated, unread count becomes 0 | Remove seeded rows |
| IT-NOTIF-003 | Dispatch follow request strategy | Authenticated sender + recipient | Notification row created with `FOLLOW_REQUEST` mapping | Remove seeded rows |
| IT-NOTIF-004 | Frontend action -> Spring unread count | Valid access token in cookies | Action returns `{ success: true, data: { count } }` | Clear cookies/session |

## 20. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Notification not found | `findById...` empty | `404` with `NOTIFICATION_NOT_FOUND` | None | `warn` |
| Ownership mismatch | Recipient/id mismatch | `403` with `NOTIFICATION_ACCESS_DENIED` | None | `warn` |
| Invalid dispatch payload | Bean validation/strategy validate fail | `400` with `NOTIFICATION_VALIDATION_ERROR` | None | `warn` |
| Strategy missing | Registry miss | `500` with `NOTIFICATION_STRATEGY_NOT_FOUND` | None | `error` |
| DB write conflict | `DataIntegrityViolationException` | `409` or `500` mapped error | Transaction rollback | `error` |
| Backend unavailable (frontend action) | fetch timeout/network | `{ success:false, error }` | User-safe message | Server-side `error` |

## 21. Future Extensibility Notes

1. New notification types require only:
   - enum extension,
   - one strategy implementation,
   - registry registration,
   - schema/action update if exposed.
2. Dispatch endpoint can be restricted to service-to-service usage once cross-module Spring integration is complete.
3. If profile identifiers migrate to UUID later, repository/service boundaries already isolate mapping changes.

## 22. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Legacy notifications API (list) | `frontend/src/app/api/notifications/route.ts` | `GET` |
| Legacy notifications API (unread count) | `frontend/src/app/api/notifications/unread-count/route.ts` | `GET` |
| Legacy notifications API (mark read) | `frontend/src/app/api/notifications/mark-read/route.ts` | `PATCH` |
| Legacy repository logic | `frontend/src/repositories/NotificationRepository.ts` | `notificationRepository` |
| Auth backend controller style reference | `backend/src/main/java/it/evodev/instagram/auth/controllers/PublicAuthController.java` | `logger.info(...)` |
| Auth private controller routing style | `backend/src/main/java/it/evodev/instagram/auth/controllers/PrivateAuthController.java` | `@RequestMapping("/api/priv/auth")` |
| Auth service logging/transaction style | `backend/src/main/java/it/evodev/instagram/auth/services/AuthService.java` | `@Transactional` |
| Auth exception handling style | `backend/src/main/java/it/evodev/instagram/auth/exceptions/AuthExceptionHandler.java` | `@RestControllerAdvice` |
| Frontend auth feature pattern | `frontend/src/features/auth/actions.ts` | `AuthActionResult` |
| Frontend auth schema pattern | `frontend/src/features/auth/schema.ts` | `authActionResultSchema` |
| API migration tracking | `reports/api_routes.csv` | `/api/notifications*` rows |
| Copilot module conventions | `.github/copilot-instructions.md` | `Workflow obbligatorio per ogni nuovo modulo CORE` |

## 23. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1-7) | Pass |
| Document architecture checks (8-13) | Pass |

Critical assumptions are explicit:
1. Notification module uses UUID as module PK while preserving compatibility with current profile numeric identifiers until dedicated profile migration is executed.
2. Legacy Next notification APIs are removed only after backend parity is validated in staging.
3. `actions.ts` naming is retained to stay consistent with existing auth feature conventions.
