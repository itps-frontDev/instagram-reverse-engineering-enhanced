package it.evodev.instagram.directs.repositories;

import it.evodev.instagram.directs.models.Chat;
import it.evodev.instagram.directs.repositories.projections.ChatWithDetailsProjection;
import it.evodev.instagram.directs.repositories.projections.MutualFollowerProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatJpaRepository extends JpaRepository<Chat, UUID> {

    @Query(value = """
            SELECT c.id                      AS chatId,
                   c.is_group                AS isGroup,
                   c.name                    AS chatName,
                   c.last_message_at         AS lastMessageAt,
                   lm.text                   AS lastMessageText,
                   lm.sender_profile_id      AS lastMessageSenderId,
                   op.id                     AS otherProfileId,
                   op.username::text          AS otherUsername,
                   op.full_name              AS otherFullName,
                   op.profile_image_url      AS otherProfileImageUrl
            FROM chats c
            JOIN chat_participants cp ON cp.chat_id = c.id AND cp.profile_id = :profileId AND cp.left_at IS NULL
            LEFT JOIN LATERAL (
                SELECT text, sender_profile_id
                FROM messages m
                WHERE m.chat_id = c.id AND m.deleted_at IS NULL
                ORDER BY m.created_at DESC, m.id DESC LIMIT 1
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

    @Query(value = """
            SELECT p.id               AS id,
                   p.username::text   AS username,
                   p.full_name        AS fullName,
                   p.profile_image_url AS profileImageUrl
            FROM profiles p
            JOIN follows f ON (
                (f.follower_profile_id = p.id AND f.following_profile_id = :profileId)
                OR (f.following_profile_id = p.id AND f.follower_profile_id = :profileId)
            )
            WHERE f.status = 'accepted'
              AND f.deleted_at IS NULL
              AND p.deleted_at IS NULL
              AND p.id != :profileId
              AND NOT EXISTS (
                SELECT 1 FROM chat_participants cp
                JOIN chats c ON c.id = cp.chat_id
                WHERE cp.profile_id = p.id
                  AND cp.left_at IS NULL
                  AND c.is_group = false
                  AND c.deleted_at IS NULL
                  AND EXISTS (
                    SELECT 1 FROM chat_participants cp2
                    WHERE cp2.chat_id = c.id AND cp2.profile_id = :profileId AND cp2.left_at IS NULL
                  )
              )
            """, nativeQuery = true)
    List<MutualFollowerProjection> findMutualFollowersWithoutChat(@Param("profileId") Long profileId);

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
}
