# Direct Messages Migration Spec (Implementation)

**Document type:** Implementation  
**Version:** 1.1  
**Scope:** Directs module (Spring Boot + WebSocket STOMP + frontend directs feature + legacy cleanup)

---

## 1. Objective

Migrate the full direct messages domain from scattered Next.js API routes, `DirectMessageRepository.ts`, and in-page polling logic to a dedicated Spring Boot module `it.evodev.instagram.directs`, aligned with the Strangler Fig pattern.

The current implementation uses HTTP polling (chat list every 3 seconds, messages every 2 seconds) from `direct/page.tsx` via four Next.js API routes. All data access is handled by `DirectMessageRepository.ts` which queries the database directly via `queryAll`/`queryOne`/`execute` helpers.

### Expected outcome

1. New backend module at `backend/src/main/java/it/evodev/instagram/directs/` with `controllers`, `dto`, `exceptions`, `models`, `repositories`, `services`.
2. UUID columns for `chats.id` e `messages.id` modificando direttamente i `CREATE TABLE` nei changeset esistenti — i volumi Docker vengono ricreati da zero quindi non serve alcuna migrazione retrocompatibile.
2. New root-level Spring config class `it.evodev.instagram.config.WebSocketConfig` that enables the STOMP in-memory broker — this is application-wide infrastructure, **not** a per-module config (see Section 4.2).
4. Three REST endpoints migrated to Spring: `GET /api/priv/direct/chats`, `GET /api/priv/direct/messages`, `POST /api/priv/direct/get-or-create`.
5. One WebSocket STOMP endpoint: clients send to `/app/direct.send`, server pushes to `/user/queue/direct`.
6. All polling removed from `direct/page.tsx`. The page connects to WebSocket once on mount; real-time delivery replaces `setInterval`.
7. Frontend `features/directs/` created with server actions (REST), Zod schemas, and a client hook `useDirectMessages.ts` for WebSocket lifecycle management.
8. Four legacy Next.js API route files deleted after parity verification.
9. `DirectMessageRepository.ts` deleted after migration.

---

## 2. Scope Boundaries

### In scope

1. New `directs` Spring module (models → repositories → service → controllers → dto → exceptions).
2. Root-level `WebSocketConfig` + `WebSocketAuthChannelInterceptor` for STOMP over WebSocket.
3. UUID per `chats.id` e `messages.id` — modifica dei `CREATE TABLE` esistenti nei tre file Liquibase (nessun volume da preservare).
4. Frontend `features/directs/` — server actions (REST), Zod schemas, `useDirectMessages` hook.
5. Removal of four legacy Next.js API route files.
6. Removal of `DirectMessageRepository.ts`.
7. Removal of all `setInterval` polling from `direct/page.tsx`.

### Out of scope

1. Group chats (`is_group = true`) — only 1-to-1 chats in scope.
2. Message deletion or editing.
3. `last_read_message_id` tracking and "read receipts" — the `chat_participants.last_read_message_id` column exists but is not used in this spec.
4. Message notifications via Spring Events (the `MessageNotificationStrategy` exists but dispatch is out of scope).
5. File/media attachments — text-only messages.
6. Message pagination — first 100 messages loaded on open (matching current behavior).
7. UUID migration for `chat_participants.id` — this PK is never exposed in API or WebSocket payloads; kept as `BIGINT`.

---

## 3. Current State (Legacy)

### Legacy Next.js API routes to replace

| Route file | Method | Current behavior |
|---|---|---|
| `frontend/src/app/api/direct/chats/route.ts` | `GET` | Returns chat list + potential contacts via `directMessageRepository.getChatsWithDetails` |
| `frontend/src/app/api/direct/messages/route.ts` | `GET ?chatId=` | Returns messages for a chat via `directMessageRepository.getMessages` |
| `frontend/src/app/api/direct/send/route.ts` | `POST` | Inserts message + updates `chats.last_message_at` via `directMessageRepository.sendMessage` |
| `frontend/src/app/api/direct/get-or-create/route.ts` | `POST` | Finds or creates 1-to-1 chat via `directMessageRepository.getOrCreateChat` |

### Legacy polling in `direct/page.tsx`

| Polling target | Interval | Lines |
|---|---|---|
| `fetchChats` (GET /api/direct/chats) | 3000 ms | `useEffect` at line 243–247 |
| `fetchMessages` (GET /api/direct/messages?chatId=) | 2000 ms | `useEffect` at line 295–319 |

Both `setInterval` calls must be removed. Chat list updates arrive via WebSocket push; message history is loaded once on chat open.

### Legacy repository responsibilities (`DirectMessageRepository.ts`)

| Method | Mapped to Spring |
|---|---|
| `getChatsWithDetails(profileId)` | `DirectService.getChats(userId)` |
| `getFollowersWithoutChat(profileId)` | `DirectService.getChats(userId)` (potential contacts merged in response) |
| `mapChatsForFrontend(chats, currentProfileId)` | Removed — mapping handled by Spring DTO |
| `mapContactsAsPotentialChats(contacts)` | Removed — mapping handled by Spring DTO |
| `isParticipant(chatId, profileId)` | `DirectService.assertParticipant(chatId, profileId)` |
| `getMessages(chatId)` | `DirectService.getMessages(userId, chatId)` |
| `sendMessage(chatId, senderProfileId, text)` | `DirectWebSocketController.handleSend` via service |
| `findExistingChat(p1, p2)` | `DirectService.getOrCreateChat(userId, otherProfileId)` |
| `createChat(creatorProfileId, otherProfileId)` | `DirectService.getOrCreateChat(userId, otherProfileId)` |
| `getOrCreateChat(p1, p2)` | `DirectService.getOrCreateChat(userId, otherProfileId)` |
| `profileExists(profileId)` | Inline check in service |

---

## 4. Target Architecture

### 4.1 Backend module layout

```
backend/src/main/java/it/evodev/instagram/directs/
├── controllers/
│   ├── DirectRestController.java
│   └── DirectWebSocketController.java
├── dto/
│   ├── requests/
│   │   └── SendMessageRequestDTO.java
│   └── responses/
│       ├── ChatSummaryResponseDTO.java
│       ├── MessageResponseDTO.java
│       └── GetOrCreateChatResponseDTO.java
├── exceptions/
│   ├── DirectException.java
│   ├── DirectNotFoundException.java
│   ├── DirectForbiddenException.java
│   ├── DirectValidationException.java
│   └── DirectExceptionHandler.java
├── models/
│   ├── Chat.java
│   ├── ChatParticipant.java
│   └── Message.java
├── repositories/
│   ├── ChatJpaRepository.java
│   ├── ChatParticipantJpaRepository.java
│   ├── MessageJpaRepository.java
│   └── projections/
│       └── ChatWithDetailsProjection.java
└── services/
    ├── DirectService.java
    └── impl/
        └── DirectServiceImpl.java
```

Root-level infrastructure config (new package):

```
backend/src/main/java/it/evodev/instagram/config/
├── WebSocketConfig.java
└── WebSocketAuthChannelInterceptor.java
```

### 4.2 WebSocket config: root level, not inside `directs`

`@EnableWebSocketMessageBroker` annotates a single Spring `@Configuration` class and configures the STOMP broker for the **entire application**. There can be only one such bean. Placing it inside `directs/config/` would make it impossible to add WebSocket support to other modules later without moving the config. It lives at `it.evodev.instagram.config.WebSocketConfig` alongside other application-wide infra (Security, CORS, Redis).

`WebSocketAuthChannelInterceptor` is also application-wide infrastructure — it validates the JWT on every STOMP `CONNECT` frame regardless of module. It lives in the same `config` package.

### 4.3 Architectural rules

1. `DirectRestController` handles REST HTTP↔DTO only; zero business logic.
2. `DirectWebSocketController` handles STOMP `@MessageMapping` only; delegates to service.
3. `DirectServiceImpl` owns all business logic, transaction boundaries, participant checks, persistence, and WebSocket push dispatch.
4. Repositories contain persistence logic only (Spring Data JPA + native SQL projections where joins are required).
5. `DirectServiceImpl` imports from `profile` module only: the profile entity and its JPA repository (to resolve `userId` from `profileId` and vice versa).
6. No events published by this module — notification dispatch is out of scope.
7. Logging: `info` at start/end of each service method; `warn` for business rule violations (not participant, profile not found); `error` in exception handlers.

### 4.4 Frontend module layout

Create:

```
frontend/src/features/directs/
├── schema.ts         ← Zod schemas for REST actions
├── actions.ts        ← 'use server' — REST server actions
├── useDirectMessages.ts  ← client-side WebSocket hook (no 'use server')
└── index.ts          ← re-exports
```

Delete after migration:

```
frontend/src/app/api/direct/chats/route.ts
frontend/src/app/api/direct/messages/route.ts
frontend/src/app/api/direct/send/route.ts
frontend/src/app/api/direct/get-or-create/route.ts
frontend/src/repositories/DirectMessageRepository.ts
```

---

## 5. Entity Design

### 5.1 `Chat.java`

```java
@Entity
@Table(name = "chats")
@Getter
@Setter
@NoArgsConstructor
public class Chat {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UuidV7Generator.generate();
    }

    @Column(name = "is_group", nullable = false)
    private Boolean isGroup;

    @Column(name = "name")
    private String name;

    @Column(name = "created_by_profile_id")
    private Long createdByProfileId;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

### 5.2 `ChatParticipant.java`

```java
@Entity
@Table(name = "chat_participants")
@Getter
@Setter
@NoArgsConstructor
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "role", nullable = false)
    private String role;   // "admin" | "member"

    @Column(name = "is_muted", nullable = false)
    private Boolean isMuted;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;
}
```

### 5.3 `Message.java`

```java
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UuidV7Generator.generate();
    }

    @Column(name = "chat_id", nullable = false, columnDefinition = "uuid")
    private UUID chatId;

    @Column(name = "sender_profile_id", nullable = false)
    private Long senderProfileId;

    @Column(name = "text", nullable = false)
    private String text;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

### 5.4 Schema reference

| Table | PK type | Soft delete | Notes |
|---|---|---|---|
| `chats` | `UUID` | `deleted_at` | `is_group=false` for 1-to-1 in scope |
| `messages` | `UUID` | `deleted_at` | `chat_id` FK diventa `UUID` |
| `chat_participants` | `BIGINT` | `left_at` (not `deleted_at`) | `chat_id` e `last_read_message_id` diventano `UUID`; `id` rimane `BIGINT` |

### 5.5 Liquibase — modifiche ai changeset esistenti

I volumi Docker vengono ricreati da zero: si modifica direttamente il `CREATE TABLE` in ciascun file, senza aggiungere nuovi changeset.

**`changelog-chats.xml`** — cambiare la colonna `id`:

```sql
-- Prima (da rimuovere):
id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

-- Dopo:
id UUID NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
```

**`changelog-messages.xml`** — cambiare `id` e `chat_id`:

```sql
-- Prima (da rimuovere):
id      BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
chat_id BIGINT NOT NULL,

-- Dopo:
id      UUID   NOT NULL DEFAULT uuid_generate_v7() PRIMARY KEY,
chat_id UUID   NOT NULL,
```

La FK `MESSAGES_CHAT_FK FOREIGN KEY (chat_id) REFERENCES chats(id)` rimane invariata nel testo — solo il tipo della colonna cambia.

**`changelog-chat-participants.xml`** — cambiare `chat_id` e `last_read_message_id`:

```sql
-- Prima (da rimuovere):
chat_id              BIGINT  NOT NULL,
last_read_message_id BIGINT,

-- Dopo:
chat_id              UUID    NOT NULL,
last_read_message_id UUID,
```

Le FK `CHAT_PARTICIPANTS_CHAT_FK` e `CHAT_PARTICIPANTS_LAST_READ_FK` rimangono invariate nel testo.

`chat_participants.id` resta `BIGINT GENERATED BY DEFAULT AS IDENTITY` — non è mai esposto in API o WebSocket.

---

## 6. Repository Design

### 6.1 `ChatJpaRepository`

Extend `JpaRepository<Chat, Long>`.

```java
// Find 1-to-1 chat between two participants (both active)
@Query(value = """
    SELECT c.id FROM chats c
    WHERE c.is_group = false AND c.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM chat_participants cp1
                  WHERE cp1.chat_id = c.id AND cp1.profile_id = :p1 AND cp1.left_at IS NULL)
      AND EXISTS (SELECT 1 FROM chat_participants cp2
                  WHERE cp2.chat_id = c.id AND cp2.profile_id = :p2 AND cp2.left_at IS NULL)
    LIMIT 1
    """, nativeQuery = true)
Optional<UUID> findExistingDirectChatId(@Param("p1") Long profileId1, @Param("p2") Long profileId2);

// Chat list for a profile ordered by last_message_at DESC
@Query(value = """
    SELECT
        c.id                     AS chatId,
        c.is_group               AS isGroup,
        c.name                   AS chatName,
        c.last_message_at        AS lastMessageAt,
        lm.text                  AS lastMessageText,
        lm.sender_profile_id     AS lastMessageSenderId,
        op.id                    AS otherProfileId,
        op.username              AS otherUsername,
        op.full_name             AS otherFullName,
        op.profile_image_url     AS otherProfileImageUrl
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id AND cp.profile_id = :profileId AND cp.left_at IS NULL
    LEFT JOIN LATERAL (
        SELECT text, sender_profile_id
        FROM messages m
        WHERE m.chat_id = c.id AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC LIMIT 1
    ) lm ON true
    LEFT JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.profile_id != :profileId AND cp2.left_at IS NULL
    LEFT JOIN profiles op ON op.id = cp2.profile_id AND op.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    ORDER BY
        CASE WHEN c.last_message_at IS NULL THEN 1 ELSE 0 END,
        c.last_message_at DESC,
        c.created_at DESC
    LIMIT 50
    """, nativeQuery = true)
List<ChatWithDetailsProjection> findChatsWithDetails(@Param("profileId") Long profileId);
```

### 6.2 `ChatParticipantJpaRepository`

Extend `JpaRepository<ChatParticipant, Long>`.

```java
// Active participants for a given chat
List<ChatParticipant> findByChatIdAndLeftAtIsNull(UUID chatId);

// Check if a profile is active participant
boolean existsByChatIdAndProfileIdAndLeftAtIsNull(UUID chatId, Long profileId);
```

### 6.3 `MessageJpaRepository`

Extend `JpaRepository<Message, Long>`.

```java
// Messages for a chat ordered newest-first, max 100
List<Message> findByChatIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID chatId, Pageable pageable);
```

Default call: `PageRequest.of(0, 100)`.

### 6.4 `ChatWithDetailsProjection`

```java
public interface ChatWithDetailsProjection {
    Long getChatId();
    Boolean getIsGroup();
    String getChatName();
    LocalDateTime getLastMessageAt();
    String getLastMessageText();
    Long getLastMessageSenderId();
    Long getOtherProfileId();
    String getOtherUsername();
    String getOtherFullName();
    String getOtherProfileImageUrl();
}
```

---

## 7. Service Design

### 7.1 `DirectService` interface

| Method | Purpose |
|---|---|
| `List<ChatSummaryResponseDTO> getChats(UUID userId)` | Chat list + potential contacts merged |
| `List<MessageResponseDTO> getMessages(UUID userId, UUID chatId)` | Message history with participant check |
| `GetOrCreateChatResponseDTO getOrCreateChat(UUID userId, Long otherProfileId)` | Get or create 1-to-1 chat |
| `MessageResponseDTO sendMessage(UUID userId, UUID chatId, String text)` | Persist + push via WebSocket |

All methods are `@Transactional` except `getMessages` (read-only, no write).

### 7.2 `getChats` flow

```
1. Resolve currentProfile via profileRepository (userId). Throw DirectNotFoundException if not found.
2. Query: chatJpaRepository.findChatsWithDetails(currentProfile.id).
3. Separate results: chats with lastMessageText != null → mappedChats list.
4. Query followers without chat:
   SELECT p.id, p.username, p.full_name, p.profile_image_url
   FROM profiles p
   JOIN follows f ON (
     (f.follower_profile_id = p.id AND f.following_profile_id = currentProfile.id)
     OR (f.following_profile_id = p.id AND f.follower_profile_id = currentProfile.id)
   )
   WHERE f.status = 'accepted' AND f.deleted_at IS NULL AND p.deleted_at IS NULL AND p.id != currentProfile.id
   → use @Query on profileJpaRepository or a dedicated query method.
5. Filter: remove followers who already have a chat (by otherProfileId).
6. Map followers to ChatSummaryResponseDTO with chatId=null, lastMessageText=null.
7. Return: mappedChats (ordered by lastMessageAt) + filteredFollowers (no ordering guarantee).
```

### 7.3 `getMessages` flow

```
1. Resolve currentProfile (userId). Throw DirectNotFoundException if not found.
2. assertParticipant(chatId UUID, currentProfile.id): check chatParticipantJpaRepository.existsByChatIdAndProfileIdAndLeftAtIsNull.
   If false → throw DirectForbiddenException("Not a participant of this chat").
3. Query: messageJpaRepository.findByChatIdAndDeletedAtIsNullOrderByCreatedAtDesc(chatId, PageRequest.of(0, 100)).
4. Map to List<MessageResponseDTO>.
5. Return list. NOTE: list is in DESC order (newest first) — matches legacy behavior for frontend scroll.
```

### 7.4 `getOrCreateChat` flow

```
1. Resolve currentProfile (userId). Throw DirectNotFoundException if not found.
2. Validate: currentProfile.id != otherProfileId (Throw DirectValidationException if equal).
3. Check: does otherProfileId exist? Use profileJpaRepository.existsByIdAndDeletedAtIsNull(otherProfileId).
   If false → throw DirectNotFoundException("Profile not found").
4. Query: chatJpaRepository.findExistingDirectChatId(currentProfile.id, otherProfileId).
5. If found: return GetOrCreateChatResponseDTO(chatId=existing).
6. If not found:
   a. INSERT into chats (is_group=false, created_by_profile_id=currentProfile.id, created_at=now, updated_at=now).
   b. INSERT into chat_participants (chatId, profileId=currentProfile.id, role='member', isMuted=false, joinedAt=now).
   c. INSERT into chat_participants (chatId, profileId=otherProfileId, role='member', isMuted=false, joinedAt=now).
   d. Return GetOrCreateChatResponseDTO(chatId=new).
```

### 7.5 `sendMessage` flow

```
1. Resolve currentProfile (userId). Throw DirectNotFoundException if not found.
2. assertParticipant(chatId, currentProfile.id): Throw DirectForbiddenException if not participant.
3. Validate: text is not blank and length <= 1000 chars. Throw DirectValidationException if invalid.
4. INSERT Message (chatId, senderProfileId=currentProfile.id, text, createdAt=now).
5. UPDATE chats SET last_message_at=now, updated_at=now WHERE id=chatId.
6. Build MessageResponseDTO from the saved entity.
7. Resolve all active participants: chatParticipantJpaRepository.findByChatIdAndLeftAtIsNull(chatId).
8. For each participant (including sender):
   a. Load ProfileVisibilityProfile for participant.profileId.
   b. Get userId UUID from profile.getUserId().
   c. Call: messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/direct", messageResponseDTO).
9. Log info: message pushed to N participants.
10. Return MessageResponseDTO (used by tests; WebSocket controller ignores return value).
```

---

## 8. REST Endpoint Design

Base: `@RequestMapping("/api/priv/direct")`.  
All endpoints require authentication.

| Method | Path | Purpose | Response |
|---|---|---|---|
| `GET` | `/api/priv/direct/chats` | Chat list for authenticated user | `DirectApiResponse<List<ChatSummaryResponseDTO>>` |
| `GET` | `/api/priv/direct/messages` | Messages for a chat | `DirectApiResponse<List<MessageResponseDTO>>` |
| `POST` | `/api/priv/direct/get-or-create` | Get or create 1-to-1 chat | `DirectApiResponse<GetOrCreateChatResponseDTO>` |

### Request parameters

`GET /api/priv/direct/messages`: query parameter `chatId` (`Long`, required). Non-numeric value → 400 via Spring binding.

`POST /api/priv/direct/get-or-create`: request body `{ "otherProfileId": <Long> }`.

### Response envelope

```java
public record DirectApiResponse<T>(
    boolean success,
    T data,
    String error,
    String message
) {
    public static <T> DirectApiResponse<T> success(T data) {
        return new DirectApiResponse<>(true, data, null, null);
    }
    public static <T> DirectApiResponse<T> error(String error, String message) {
        return new DirectApiResponse<>(false, null, error, message);
    }
}
```

---

## 9. WebSocket Design (STOMP)

### 9.1 `WebSocketConfig`

Package: `it.evodev.instagram.config`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/user");       // in-memory broker for user queues
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")      // tighten in production
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor());
    }

    @Bean
    public WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor() {
        return new WebSocketAuthChannelInterceptor();
    }
}
```

### 9.2 `WebSocketAuthChannelInterceptor`

Package: `it.evodev.instagram.config`

Validates JWT on every STOMP `CONNECT` frame. The principal name is set to the `userId` UUID string extracted from the token — this is the identifier used by `convertAndSendToUser`.

```java
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessagingException("Missing or invalid Authorization header on STOMP CONNECT");
            }

            String token = authHeader.substring(7);
            try {
                String userId = jwtService.extractSubject(token);   // returns userId UUID as String
                // Set a simple Principal — name = userId UUID string
                accessor.setUser(() -> userId);
            } catch (Exception e) {
                throw new MessagingException("Invalid JWT on STOMP CONNECT: " + e.getMessage());
            }
        }

        return message;
    }
}
```

### 9.3 `DirectWebSocketController`

Package: `it.evodev.instagram.directs.controllers`

```java
@Controller
@RequiredArgsConstructor
public class DirectWebSocketController {

    private final DirectService directService;

    @MessageMapping("/direct.send")
    public void handleSend(Principal principal, @Payload SendMessageRequestDTO request) {
        UUID userId = UUID.fromString(principal.getName());
        directService.sendMessage(userId, request.chatId(), request.text());  // chatId is UUID
    }
}
```

No return value — the service dispatches to all participants via `SimpMessagingTemplate`.

### 9.4 Client connection flow (contract for frontend hook)

```
1. Client creates STOMP client with brokerURL: ws://{host}/ws
2. CONNECT headers: { Authorization: "Bearer {accessToken}" }
3. On CONNECTED: subscribe to /user/queue/direct
4. On message frame received: parse body as MessageResponseDTO
   → update messages list if chatId matches current chat
   → update chat list last message preview (for any chatId)
5. To send: client.publish({ destination: '/app/direct.send', body: JSON.stringify({ chatId, text }) })
6. On disconnect / error: reconnect with exponential backoff (handled by @stomp/stompjs internally)
7. On component unmount: client.deactivate()
```

---

## 10. DTO Design

### `ChatSummaryResponseDTO`

```java
public record ChatSummaryResponseDTO(
    UUID chatId,                    // null for potential contacts with no existing chat
    Long otherProfileId,
    String otherUsername,
    String otherFullName,
    String otherProfileImageUrl,
    String lastMessageText,         // null for potential contacts
    LocalDateTime lastMessageAt,    // null for potential contacts
    Boolean isFromMe                // null for potential contacts
) {}
```

### `MessageResponseDTO`

```java
public record MessageResponseDTO(
    UUID id,
    UUID chatId,
    Long senderProfileId,
    String text,
    LocalDateTime createdAt
) {}
```

### `GetOrCreateChatResponseDTO`

```java
public record GetOrCreateChatResponseDTO(UUID chatId) {}
```

### `SendMessageRequestDTO`

```java
public record SendMessageRequestDTO(
    @NotNull UUID chatId,
    @NotBlank @Size(max = 1000) String text
) {}
```

---

## 11. Frontend Feature Module

### 11.1 `schema.ts`

```ts
import { z } from 'zod';

// --- Chat list ---

export const chatSummarySchema = z.object({
  chatId: z.string().uuid().nullable(),
  otherProfileId: z.number().int(),
  otherUsername: z.string().nullable(),
  otherFullName: z.string().nullable(),
  otherProfileImageUrl: z.string().nullable(),
  lastMessageText: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  isFromMe: z.boolean().nullable(),
});
export type ChatSummary = z.infer<typeof chatSummarySchema>;

export const getChatsResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.array(chatSummarySchema) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetChatsResult = z.infer<typeof getChatsResultSchema>;

// --- Messages ---

export const messageItemSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderProfileId: z.number().int(),
  text: z.string(),
  createdAt: z.string(),
});
export type MessageItem = z.infer<typeof messageItemSchema>;

export const getMessagesInputSchema = z.object({
  chatId: z.string().uuid(),
});
export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const getMessagesResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.array(messageItemSchema) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetMessagesResult = z.infer<typeof getMessagesResultSchema>;

// --- Get or create chat ---

export const getOrCreateChatInputSchema = z.object({
  otherProfileId: z.number().int().positive(),
});
export type GetOrCreateChatInput = z.infer<typeof getOrCreateChatInputSchema>;

export const getOrCreateChatResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: z.object({ chatId: z.string().uuid() }) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetOrCreateChatResult = z.infer<typeof getOrCreateChatResultSchema>;
```

### 11.2 `actions.ts`

```ts
'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { redirect } from 'next/navigation';
import {
  getMessagesInputSchema, getOrCreateChatInputSchema,
  type GetChatsResult, type GetMessagesInput, type GetMessagesResult,
  type GetOrCreateChatInput, type GetOrCreateChatResult,
} from './schema';

function mapDirectError(status: number): string {
  if (status === 403) return 'Access denied.';
  if (status === 404) return 'Chat or profile not found.';
  if (status === 400) return 'Invalid request.';
  return 'Direct messages service temporarily unavailable.';
}

export async function getChatsAction(): Promise<GetChatsResult> {
  let response: Response | null = null;
  try {
    response = await springFetch('/api/priv/direct/chats', { method: 'GET' });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data ?? [] };
}

export async function getMessagesAction(input: GetMessagesInput): Promise<GetMessagesResult> {
  const parsed = getMessagesInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid chat ID.' };

  let response: Response | null = null;
  try {
    response = await springFetch(`/api/priv/direct/messages?chatId=${parsed.data.chatId}`, { method: 'GET' });  // chatId is UUID string
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data ?? [] };
}

export async function getOrCreateChatAction(input: GetOrCreateChatInput): Promise<GetOrCreateChatResult> {
  const parsed = getOrCreateChatInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid profile ID.' };

  let response: Response | null = null;
  try {
    response = await springFetch('/api/priv/direct/get-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otherProfileId: parsed.data.otherProfileId }),
    });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Direct messages service is unreachable.' };
  }
  if (!response.ok) return { success: false, error: mapDirectError(response.status) };
  const payload = await response.json();
  return { success: true, data: { chatId: payload.data.chatId } };
}
```

### 11.3 `useDirectMessages.ts`

Client-side hook — **no** `'use server'`. Manages WebSocket lifecycle.

```ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { MessageItem } from './schema';

interface UseDirectMessagesOptions {
  accessToken: string | null;
  onMessage: (message: MessageItem) => void;
  wsUrl: string;   // e.g. "http://localhost:8080/ws"
}

export function useDirectMessages({ accessToken, onMessage, wsUrl }: UseDirectMessagesOptions) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref stable
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    if (!accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/direct', (frame) => {
          try {
            const message: MessageItem = JSON.parse(frame.body);
            onMessageRef.current(message);
          } catch {
            console.error('[useDirectMessages] Failed to parse message frame');
          }
        });
      },
      onStompError: (frame) => {
        console.error('[useDirectMessages] STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [accessToken, wsUrl]);

  const sendMessage = useCallback((chatId: number, text: string) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('[useDirectMessages] Cannot send: client not connected');
      return;
    }
    client.publish({
      destination: '/app/direct.send',
      body: JSON.stringify({ chatId, text }),
    });
  }, []);

  return { sendMessage };
}
```

`@stomp/stompjs` and `sockjs-client` must be added to `frontend/package.json`.

### 11.4 `index.ts`

```ts
export * from './actions';
export * from './schema';
export { useDirectMessages } from './useDirectMessages';
```

### 11.5 Frontend page migration (`direct/page.tsx`)

| Remove | Replace with |
|---|---|
| `setInterval(fetchChats, 3000)` | `useDirectMessages` hook — chat list updated on incoming message via `onMessage` callback |
| `setInterval(fetchMessages, 2000)` | Message history loaded once on chat open via `getMessagesAction`; new messages arrive via `onMessage` |
| `fetch('/api/direct/chats')` | `getChatsAction()` — called once on mount |
| `fetch('/api/direct/messages?chatId=...')` | `getMessagesAction({ chatId })` — called when `selectedChatId` changes |
| `fetch('/api/direct/get-or-create', { method: 'POST' })` | `getOrCreateChatAction({ otherProfileId })` |
| `fetch('/api/direct/send', { method: 'POST' })` | `sendMessage(chatId, text)` from `useDirectMessages` hook |
| `handleSend` function (current inline fetch logic) | Calls `sendMessage` from hook; optimistic UI update via `onMessage` callback |
| `loadingMessages` + `setTimeout` on chat select | Replaced by `getMessagesAction` + React state |

The `onMessage` callback in the page:
```ts
const handleIncomingMessage = useCallback((message: MessageItem) => {
  if (message.chatId === selectedChatId) {
    setMessages(prev => [message, ...prev]);  // prepend (list is DESC)
  }
  // Always update chat list last message
  setContacts(prev => prev.map(c =>
    c.chatId === message.chatId
      ? { ...c, lastMessageText: message.text, lastMessageAt: message.createdAt, isFromMe: message.senderProfileId === profile?.id }
      : c
  ));
}, [selectedChatId, profile?.id]);
```

---

## 12. Exception Design

| Exception class | Trigger | HTTP | Error code |
|---|---|---|---|
| `DirectNotFoundException` | Profile or chat not found | 404 | `DIRECT_NOT_FOUND` |
| `DirectForbiddenException` | Not a participant of the chat | 403 | `DIRECT_FORBIDDEN` |
| `DirectValidationException` | Self-chat, blank text, message too long | 400 | `DIRECT_VALIDATION_ERROR` |
| `DirectException` | Base runtime exception | 500 | `DIRECT_ERROR` |

`DirectExceptionHandler` annotated `@RestControllerAdvice(basePackages = "it.evodev.instagram.directs")`.

Response format:
```json
{ "success": false, "data": null, "error": "<code>", "message": "<user-safe message>" }
```

WebSocket errors (e.g., not participant, invalid chatId on `handleSend`) are logged server-side but not returned to the client over STOMP — the client's `onStompError` / `onMessage` will not receive an error frame for these cases. Silent server-side failure with `error` log.

---

## 13. Migration Plan (Strangler)

1. **Create `directs` Spring module** — models → repositories → service (read methods only: `getChats`, `getMessages`, `getOrCreateChat`) → REST controller.
2. **Add root-level `WebSocketConfig` + `WebSocketAuthChannelInterceptor`** — verify Spring starts without errors.
3. **Add `sendMessage` to service** — add `DirectWebSocketController`. Verify message push via manual STOMP client test.
4. **Create `frontend/src/features/directs/`** — `schema.ts`, `actions.ts`, `useDirectMessages.ts`, `index.ts`.
5. **Migrate `direct/page.tsx`** — replace all `fetch('/api/direct/...')` calls with server actions; replace polling with hook; remove `setInterval` calls.
6. **Parity verification** — open two browser sessions, send messages, verify both receive in real-time; verify chat list updates; verify message history loads on chat open.
7. **Delete legacy** — four Next.js API route files + `DirectMessageRepository.ts`.

---

## 14. Cleanup Plan

### Legacy API routes to delete

1. `frontend/src/app/api/direct/chats/route.ts`
2. `frontend/src/app/api/direct/messages/route.ts`
3. `frontend/src/app/api/direct/send/route.ts`
4. `frontend/src/app/api/direct/get-or-create/route.ts`

If `frontend/src/app/api/direct/` becomes empty after removal, delete the directory.

### Legacy repository to delete

1. `frontend/src/repositories/DirectMessageRepository.ts`

Check `frontend/src/repositories/index.ts` after removal — remove the `directMessageRepository` export. If the file becomes empty or only re-exports removed items, delete it.

### npm dependencies to add

Add to `frontend/package.json`:
- `@stomp/stompjs` — STOMP protocol client
- `sockjs-client` — SockJS transport fallback
- `@types/sockjs-client` — TypeScript types

### Spring dependencies to add

Add to `backend/pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

---

## 15. Security Considerations (OWASP-focused)

1. `userId` resolved from Spring Security / WebSocket `Principal` context — never from request body (Broken Access Control).
2. Participant check enforced in `DirectServiceImpl` before every message read or send — not in controller.
3. `chatId` is a `Long` path/query param; non-numeric values return `400` via Spring binding before reaching the controller.
4. All JPA queries use named parameters — no string concatenation (SQL Injection).
5. Text length validated at `@Size(max = 1000)` on `SendMessageRequestDTO` before persistence.
6. WebSocket JWT validated on every STOMP `CONNECT` frame by `WebSocketAuthChannelInterceptor` — unauthenticated connections are rejected with `MessagingException`.
7. `setAllowedOriginPatterns("*")` in dev only — must be restricted to known frontend origin before production deploy.
8. Logging never includes message text content or JWT tokens.
9. Self-chat guard: `currentProfile.id != otherProfileId` validated in `getOrCreateChat`.

---

## 16. Anti-Patterns (DO NOT)

| ❌ Don't | ✅ Do instead | Why |
|---|---|---|
| Place `WebSocketConfig` inside `directs/config/` | Place in root `it.evodev.instagram.config` | `@EnableWebSocketMessageBroker` is application-wide singleton — second bean would cause startup failure |
| Keep polling (`setInterval`) alongside WebSocket | Remove all polling after hook is wired | Polling + WS duplicates requests and causes UI race conditions |
| Return data from `@MessageMapping` method via return value | Use `SimpMessagingTemplate.convertAndSendToUser` in service | Explicit targeting per participant; return value goes to `/topic/...` broadcasts, not user-specific queues |
| Subscribe to `/topic/chat/{chatId}` per-room | Subscribe to `/user/queue/direct` per user | Per-room subscriptions require server tracking of room membership; user queue is simpler and already auth-scoped |
| Pass JWT as WebSocket URL query param (`?token=...`) | Pass in STOMP `CONNECT` header | URL params appear in server access logs — token exposure |
| Call `messagingTemplate` directly in `DirectWebSocketController` | Delegate to `DirectServiceImpl` | Controller must stay transport-only; service owns business logic and push dispatch |
| Trust `chatId` or `profileId` from STOMP frame without participant check | Always check `assertParticipant` in service | User could forge any chatId in the STOMP frame payload |
| Load all messages on every WebSocket frame | Load history once via `getMessagesAction`, append new via WS | Full reload on every message is O(N) — WebSocket push is O(1) |
| Create a new WebSocket connection per chat selection | Maintain one persistent connection per user session | Connection setup is expensive; routing is via queue subscription, not per-chat connection |
| Inline `fetch('/api/direct/...')` in `direct/page.tsx` after migration | Use server actions from `features/directs/actions.ts` | Direct fetch breaks the Strangler Fig boundary; server actions go through Spring |

---

## 17. Test Case Specifications

> **Stato attuale:** nessun test applicativo esiste nel progetto. Le tabelle seguenti specificano cosa va scritto, non cosa è già presente.

### Unit tests required

| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-DIRECT-001 | `getOrCreateChat` — new chat | Valid userId, valid otherProfileId, no existing chat | Returns new chatId, 2 participant rows inserted | Self-chat (same profileId) → `DirectValidationException` |
| TC-DIRECT-002 | `getOrCreateChat` — existing chat | Valid userId, otherProfileId with existing active chat | Returns existing chatId, no new rows inserted | Deleted chat (deleted_at set) → treated as not existing |
| TC-DIRECT-003 | `getMessages` — not participant | UserId not in chat_participants | `DirectForbiddenException` | `left_at` is set (left chat) → also forbidden |
| TC-DIRECT-004 | `sendMessage` — valid | Participant sends text ≤ 1000 chars | Message persisted, `convertAndSendToUser` called for each participant | Exactly 2 participants — push called twice |
| TC-DIRECT-005 | `sendMessage` — text too long | Text of 1001 chars | `DirectValidationException` | Empty string → `DirectValidationException` |
| TC-DIRECT-006 | `sendMessage` — not participant | UserId not in chat | `DirectForbiddenException` | |
| TC-DIRECT-007 | `WebSocketAuthChannelInterceptor` — valid JWT | STOMP CONNECT with valid Bearer token | Principal name set to userId UUID string | |
| TC-DIRECT-008 | `WebSocketAuthChannelInterceptor` — invalid JWT | STOMP CONNECT with expired/forged token | `MessagingException` thrown | Missing header → `MessagingException` |
| TC-DIRECT-009 | Frontend Zod — `getMessagesAction` | `{ chatId: -1 }` | Validation failure `{ success: false }` | Non-integer, zero, null |
| TC-DIRECT-010 | Frontend `useDirectMessages` | `sendMessage` called before connection | Warning logged, no publish | `client.connected = false` |

### Integration tests required

| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-DIRECT-001 | GET /api/priv/direct/chats | Seed user + chat + message | `200`, chat list array with lastMessageText populated | Delete seeded rows |
| IT-DIRECT-002 | POST /api/priv/direct/get-or-create — creates | Seed two profiles, no chat | `200`, new chatId in response, 2 rows in `chat_participants` | Delete chat + participant rows |
| IT-DIRECT-003 | POST /api/priv/direct/get-or-create — finds | Seed two profiles + existing chat | `200`, same chatId returned, no duplicate rows | Delete seeded rows |
| IT-DIRECT-004 | GET /api/priv/direct/messages — forbidden | Seed chat + user NOT in participants | `403`, `DIRECT_FORBIDDEN` | Delete seeded rows |
| IT-DIRECT-005 | GET /api/priv/direct/messages — authorized | Seed chat + participant + messages | `200`, messages list descending by createdAt | Delete seeded rows |
| IT-DIRECT-006 | STOMP send message | Two users connected via WS, user A sends | User B receives push on `/user/queue/direct`, message row in DB | Delete message + update chat |
| IT-DIRECT-007 | STOMP CONNECT — invalid token | Connect with forged JWT | STOMP error frame / connection refused | — |
| IT-DIRECT-008 | Frontend `getChatsAction` → Spring | Valid access token in session | `{ success: true, data: [...] }` | Clear session |

---

## 18. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Profile not found (current user) | `profileRepository` returns empty on userId lookup | 404 `DIRECT_NOT_FOUND` | None | `warn` |
| Profile not found (other user in get-or-create) | `profileRepository.existsByIdAndDeletedAtIsNull` returns false | 404 `DIRECT_NOT_FOUND` | None | `warn` |
| Not a participant (REST) | `chatParticipantJpaRepository.existsByChatIdAndProfileIdAndLeftAtIsNull` returns false | 403 `DIRECT_FORBIDDEN` | None | `warn` |
| Not a participant (WebSocket) | Same check inside `sendMessage` service | Swallowed — no STOMP error frame returned; message not persisted | None | `error` |
| Self-chat attempt | `currentProfile.id == otherProfileId` in `getOrCreateChat` | 400 `DIRECT_VALIDATION_ERROR` | None | `warn` |
| Text blank or > 1000 chars | `@Size` + `@NotBlank` on DTO or inline service check | 400 `DIRECT_VALIDATION_ERROR` (REST) / swallowed (WS) | None | `warn` |
| Non-numeric `chatId` query param | Spring parameter binding failure | 400 (Spring default) | None | Spring log |
| JWT invalid on STOMP CONNECT | `WebSocketAuthChannelInterceptor` throws `MessagingException` | Connection refused | None | `error` |
| JWT missing on STOMP CONNECT | `WebSocketAuthChannelInterceptor` throws `MessagingException` | Connection refused | None | `warn` |
| Backend unreachable (frontend action) | `fetch` timeout / `SpringAuthError` / network error | `{ success: false, error: "..." }` | UI shows stale state | Server-side `error` |
| Session expired (frontend action) | `SpringAuthError` thrown by `springFetch` | `redirect('/login')` | — | — |
| WebSocket connection dropped (frontend hook) | `@stomp/stompjs` triggers `onDisconnect` | Auto-reconnect after 5 seconds | Stale messages until reconnected | Client-side console |

---

## 19. References (Deep Links)

| Topic | Location | Anchor |
|---|---|---|
| Legacy API route — chats | `frontend/src/app/api/direct/chats/route.ts` | `GET` |
| Legacy API route — messages | `frontend/src/app/api/direct/messages/route.ts` | `GET` |
| Legacy API route — send | `frontend/src/app/api/direct/send/route.ts` | `POST` |
| Legacy API route — get-or-create | `frontend/src/app/api/direct/get-or-create/route.ts` | `POST` |
| Legacy repository (to delete) | `frontend/src/repositories/DirectMessageRepository.ts` | class |
| Direct page (polling to remove) | `frontend/src/app/(main)/direct/page.tsx` | `setInterval` at lines 245, 317 |
| Liquibase — chats table | `backend/src/main/resources/db/changelog/migrations/changelog-chats.xml` | changeSet `CHATS;2026-05-07;cbiallo;01` |
| Liquibase — messages table | `backend/src/main/resources/db/changelog/migrations/changelog-messages.xml` | changeSet `MESSAGES;2026-05-07;cbiallo;01` |
| Liquibase — chat_participants table | `backend/src/main/resources/db/changelog/migrations/changelog-chat-participants.xml` | changeSet `CHAT_PARTICIPANTS;2026-05-07;cbiallo;01` |
| JwtService (for interceptor) | `backend/src/main/java/it/evodev/instagram/auth/services/JwtService.java` | `extractSubject` method |
| Follow module (reference architecture) | `backend/src/main/java/it/evodev/instagram/follow/` | all |
| Follow spec (reference pattern) | `docs/specs/follow.md` | full doc |
| Likes server action pattern | `frontend/src/features/likes/actions.ts` | `toggleLikeAction` |
| springFetch helper | `frontend/src/lib/spring-client.ts` | `springFetch` |
| SpringAuthError | `frontend/src/lib/spring-error.ts` | `SpringAuthError` |
| ProfileVisibilityProfile entity (for userId resolution) | `backend/src/main/java/it/evodev/instagram/profile/models/ProfileVisibilityProfile.java` | `getUserId()` field |

---

## 20. Postman Collection

Create:

```
postman/collections/direct/
├── .resources/
│   └── definition.yaml
├── Get Chats.request.yaml
├── Get Messages.request.yaml
└── Get Or Create Chat.request.yaml
```

### `definition.yaml`

```yaml
$kind: collection
name: Direct
description: Endpoint privati per la gestione dei messaggi diretti — lista chat, storico messaggi e creazione chat 1-to-1. Il real-time è gestito via WebSocket STOMP (non testabile in Postman — usare un client STOMP dedicato come STOMP WebSocket Tester o la console browser).
```

### `Get Chats.request.yaml`

```yaml
$kind: http-request
name: Get Chats
description: >
  Restituisce la lista delle chat dell'utente autenticato con l'ultimo messaggio e i dati dell'altro partecipante.
  Include anche i contatti (follower/following reciproci) senza chat esistente (chatId null).
  Ordinamento: chat con messaggi per lastMessageAt DESC, poi contatti senza chat.
method: GET
url: "{{baseUrl}}/api/priv/direct/chats"
headers:
  Authorization: Bearer {{accessToken}}
order: 100
```

### `Get Messages.request.yaml`

```yaml
$kind: http-request
name: Get Messages
description: >
  Restituisce i messaggi di una chat specifica (max 100, ordine DESC per createdAt).
  403 DIRECT_FORBIDDEN se l'utente autenticato non è partecipante attivo.
  Usa {{directChatId}} (numero intero, ID della chat).
method: GET
url: "{{baseUrl}}/api/priv/direct/messages?chatId={{directChatId}}"
headers:
  Authorization: Bearer {{accessToken}}
order: 200
```

### `Get Or Create Chat.request.yaml`

```yaml
$kind: http-request
name: Get Or Create Chat
description: >
  Trova o crea una chat 1-to-1 tra l'utente autenticato e un altro profilo.
  Se la chat esiste già, restituisce l'ID esistente senza creare duplicati.
  400 DIRECT_VALIDATION_ERROR se otherProfileId corrisponde all'utente stesso.
  404 DIRECT_NOT_FOUND se otherProfileId non esiste.
  Usa {{directOtherProfileId}} (numero intero, ID del profilo destinatario).
method: POST
url: "{{baseUrl}}/api/priv/direct/get-or-create"
headers:
  Authorization: Bearer {{accessToken}}
  Content-Type: application/json
body:
  mediaType: application/json
  text: |
    {
      "otherProfileId": {{directOtherProfileId}}
    }
order: 300
```

### Variabili Postman da aggiungere all'environment

| Variable | Example value | Used by |
|---|---|---|
| `directChatId` | `1` | Get Messages |
| `directOtherProfileId` | `42` | Get Or Create Chat |

> **Nota WebSocket:** Il canale STOMP non è testabile con richieste HTTP Postman standard. Per testare il flusso WebSocket in sviluppo usare la console browser (connettendosi con `@stomp/stompjs`) o un tool dedicato come [STOMP WebSocket Tester](https://stomp-tester.example). Nessun request file WebSocket va aggiunto alla collection Postman.

---

## 21. Spec Gate Self-Assessment

| Check | Status |
|---|---|
| 13-item Spec Gate completeness | Pass |
| AI Coder Understandability Score | 9.5 / 10 |
| Foundation checks (1–7) | Pass |
| Document architecture checks (8–13) | Pass |

Critical assumptions made explicit:

1. I volumi Docker vengono abbattuti e ricreati da zero — i tre file Liquibase esistenti vengono modificati direttamente nel `CREATE TABLE` senza aggiungere nuovi changeset.
2. `chats.id` e `messages.id` diventano `UUID DEFAULT uuid_generate_v7()`. `messages.chat_id`, `chat_participants.chat_id` e `chat_participants.last_read_message_id` diventano `UUID`. `chat_participants.id` rimane `BIGINT`.
3. The in-memory STOMP broker is sufficient for single-instance deployment. Redis Pub/Sub integration is a future step if horizontal scaling is required.
4. Only 1-to-1 chats (`is_group = false`) are supported in this spec. Group chat logic is excluded.
5. Message history is loaded via REST on chat selection (max 100 messages). Pagination is not implemented — a separate spec is required if infinite scroll is needed.
6. `ProfileVisibilityProfile.getUserId()` returns a `UUID` — this is used to resolve the WebSocket principal name for `convertAndSendToUser`.
7. `@stomp/stompjs` and `sockjs-client` packages are not yet in `frontend/package.json`. They must be added before the hook can be implemented.
8. The WebSocket endpoint `/ws` is on the same host/port as the Spring REST API. CORS is handled by `setAllowedOriginPatterns` in `WebSocketConfig`.
9. `springFetch` and `SpringAuthError` already exist in the frontend codebase — they are used by all server actions consistently with the likes and follow modules.
