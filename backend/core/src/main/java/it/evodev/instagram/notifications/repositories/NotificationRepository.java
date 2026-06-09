package it.evodev.instagram.notifications.repositories;

import it.evodev.instagram.notifications.models.Notification;
import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.models.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByIdAndRecipientProfileIdAndDeletedAtIsNull(UUID id, Long recipientProfileId);

    @Query("""
            SELECT n FROM Notification n
            WHERE n.recipientProfileId = :recipientProfileId
              AND n.deletedAt IS NULL
              AND (:senderProfileId IS NULL OR n.senderProfileId = :senderProfileId)
              AND (:referenceType IS NULL OR n.referenceType = :referenceType)
              AND (:referenceId IS NULL OR n.referenceId = :referenceId)
            """)
    List<Notification> findByFilterAndDeletedAtIsNull(
            @Param("recipientProfileId") Long recipientProfileId,
            @Param("senderProfileId") Long senderProfileId,
            @Param("referenceType") NotificationReferenceType referenceType,
            @Param("referenceId") Long referenceId
    );

    List<Notification> findByRecipientProfileIdAndSenderProfileIdAndTypeAndDeletedAtIsNull(
            Long recipientProfileId,
            Long senderProfileId,
            NotificationType type
    );

    long countByRecipientProfileIdAndIsReadFalseAndDeletedAtIsNull(Long recipientProfileId);

    boolean existsByRecipientProfileIdAndSenderProfileIdAndTypeAndReferenceTypeAndReferenceIdAndCreatedAtAfterAndDeletedAtIsNull(
            Long recipientProfileId,
            Long senderProfileId,
            NotificationType type,
            NotificationReferenceType referenceType,
            Long referenceId,
            LocalDateTime createdAt
    );

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.recipientProfileId = :recipientProfileId
              AND n.isRead = false
              AND n.deletedAt IS NULL
            """)
    int markAllAsRead(@Param("recipientProfileId") Long recipientProfileId);

    @Query(value = """
            SELECT
              n.id AS id,
              n.type AS type,
              n.sender_profile_id AS senderProfileId,
              CAST(p.username AS TEXT) AS senderUsername,
              p.full_name AS senderFullName,
              p.profile_image_url AS senderProfileImageUrl,
              COALESCE(p.is_verified, FALSE) AS senderIsVerified,
              n.reference_type AS referenceType,
              n.reference_id AS referenceId,
              CASE
                WHEN n.reference_type = 'post' THEN n.reference_id
                WHEN n.reference_type = 'comment' THEN c.post_id
                ELSE NULL
              END AS referencePostId,
              COALESCE(pm_post.media_url, pm_comment.media_url, s.media_url) AS referenceImageUrl,
              COALESCE(pm_post.media_type, pm_comment.media_type, s.media_type) AS referenceMediaType,
              n.is_read AS isRead,
              n.created_at AS createdAt
            FROM notifications n
            LEFT JOIN profiles p ON n.sender_profile_id = p.id AND p.deleted_at IS NULL
            LEFT JOIN posts ON n.reference_type = 'post' AND n.reference_id = posts.id AND posts.deleted_at IS NULL
            LEFT JOIN post_media pm_post ON posts.id = pm_post.post_id AND pm_post.position = 0 AND pm_post.deleted_at IS NULL
            LEFT JOIN comments c ON n.reference_type = 'comment' AND n.reference_id = c.id AND c.deleted_at IS NULL
            LEFT JOIN posts posts_from_comment ON c.post_id = posts_from_comment.id AND posts_from_comment.deleted_at IS NULL
            LEFT JOIN post_media pm_comment ON posts_from_comment.id = pm_comment.post_id AND pm_comment.position = 0 AND pm_comment.deleted_at IS NULL
            LEFT JOIN stories s ON n.reference_type = 'story' AND n.reference_id = s.id AND s.deleted_at IS NULL
            WHERE n.recipient_profile_id = :recipientProfileId
              AND n.deleted_at IS NULL
              AND (CAST(:cursorCreatedAt AS TIMESTAMPTZ) IS NULL OR n.created_at < CAST(:cursorCreatedAt AS TIMESTAMPTZ))
            ORDER BY n.created_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<NotificationFeedProjection> findFeedByRecipientProfileId(
            @Param("recipientProfileId") Long recipientProfileId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("limit") int limit
    );
}
