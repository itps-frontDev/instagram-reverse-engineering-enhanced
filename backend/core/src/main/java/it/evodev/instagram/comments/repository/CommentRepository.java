package it.evodev.instagram.comments.repository;

import it.evodev.instagram.comments.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    interface CommentFeedProjection {
        Long getId();
        Long getPostId();
        Long getProfileId();
        Long getParentId();
        String getText();
        Integer getLikesCount();
        Instant getCreatedAt();
        String getProfileUsername();
        String getProfileFullName();
        String getProfileImageUrl();
        Boolean getProfileIsVerified();
        Boolean getProfileHasActiveStory();
        Boolean getProfileHasViewedStory();
        Boolean getProfileIsPrivate();
        Boolean getIsLikedByCurrentUser();
    }

    interface CommentPostAccessProjection {
        Long getId();
        Long getProfileId();
        String getProfileUsername();
        Boolean getCommentsDisabled();
        Integer getCommentsCount();
        Boolean getProfileIsPrivate();
    }

    interface CommentOwnershipProjection {
        Long getId();
        Long getPostId();
        Long getProfileId();
        Long getParentId();
        Long getPostOwnerProfileId();
    }

    boolean existsByIdAndDeletedAtIsNull(Long id);

    boolean existsByIdAndPostIdAndDeletedAtIsNull(Long id, Long postId);

    @Query(value = """
            SELECT
              p.id AS id,
              p.profile_id AS profileId,
              CAST(pr.username AS TEXT) AS profileUsername,
              p.is_comments_disabled AS commentsDisabled,
              p.comments_count AS commentsCount,
              pr.is_private AS profileIsPrivate
            FROM posts p
            INNER JOIN profiles pr ON pr.id = p.profile_id
            WHERE p.id = :postId
              AND p.deleted_at IS NULL
              AND pr.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<CommentPostAccessProjection> findPostAccessById(@Param("postId") Long postId);

    @Query(value = """
            SELECT
              c.id AS id,
              c.post_id AS postId,
              c.profile_id AS profileId,
              c.parent_id AS parentId,
              c.text AS text,
              c.likes_count AS likesCount,
              c.created_at AS createdAt,
              CAST(p.username AS TEXT) AS profileUsername,
              p.full_name AS profileFullName,
              p.profile_image_url AS profileImageUrl,
              p.is_verified AS profileIsVerified,
              p.is_private AS profileIsPrivate,
              (
                SELECT CASE
                  WHEN COUNT(*) > 0 AND EXISTS (
                    SELECT 1 FROM stories s2
                    WHERE s2.profile_id = p.id
                      AND s2.deleted_at IS NULL
                      AND s2.expires_at > NOW()
                      AND (
                        s2.profile_id = :currentProfileId OR
                        s2.profile_id IN (
                          SELECT following_profile_id FROM follows
                          WHERE follower_profile_id = :currentProfileId
                            AND status = 'accepted'
                            AND deleted_at IS NULL
                        ) OR NOT p.is_private
                      )
                      AND NOT EXISTS (
                        SELECT 1 FROM story_views sv
                        WHERE sv.story_id = s2.id
                          AND sv.viewer_profile_id = :currentProfileId
                      )
                  ) THEN TRUE ELSE FALSE
                END
                FROM stories s
                WHERE s.profile_id = p.id
                  AND s.expires_at > NOW()
                  AND s.deleted_at IS NULL
              ) AS profileHasActiveStory,
              (
                SELECT COUNT(*) > 0
                FROM story_views sv
                INNER JOIN stories s ON s.id = sv.story_id
                WHERE s.profile_id = p.id
                  AND sv.viewer_profile_id = :currentProfileId
                  AND s.deleted_at IS NULL
                  AND s.expires_at > NOW()
              ) AS profileHasViewedStory,
              EXISTS (
                SELECT 1
                FROM likes l
                WHERE l.likeable_type = 'comment'
                  AND l.likeable_id = c.id
                  AND l.profile_id = :currentProfileId
                  AND l.deleted_at IS NULL
              ) AS isLikedByCurrentUser
            FROM comments c
            INNER JOIN profiles p ON p.id = c.profile_id
            WHERE c.post_id = :postId
              AND c.deleted_at IS NULL
              AND p.deleted_at IS NULL
            ORDER BY c.created_at ASC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<CommentFeedProjection> findCommentsForPost(
            @Param("postId") Long postId,
            @Param("currentProfileId") Long currentProfileId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT
              c.id AS id,
              c.post_id AS postId,
              c.profile_id AS profileId,
              c.parent_id AS parentId,
              c.text AS text,
              c.likes_count AS likesCount,
              c.created_at AS createdAt,
              CAST(p.username AS TEXT) AS profileUsername,
              p.full_name AS profileFullName,
              p.profile_image_url AS profileImageUrl,
              p.is_verified AS profileIsVerified,
              p.is_private AS profileIsPrivate,
              (
                SELECT CASE
                  WHEN COUNT(*) > 0 AND EXISTS (
                    SELECT 1 FROM stories s2
                    WHERE s2.profile_id = p.id
                      AND s2.deleted_at IS NULL
                      AND s2.expires_at > NOW()
                      AND (
                        s2.profile_id = :currentProfileId OR
                        s2.profile_id IN (
                          SELECT following_profile_id FROM follows
                          WHERE follower_profile_id = :currentProfileId
                            AND status = 'accepted'
                            AND deleted_at IS NULL
                        ) OR NOT p.is_private
                      )
                      AND NOT EXISTS (
                        SELECT 1 FROM story_views sv
                        WHERE sv.story_id = s2.id
                          AND sv.viewer_profile_id = :currentProfileId
                      )
                  ) THEN TRUE ELSE FALSE
                END
                FROM stories s
                WHERE s.profile_id = p.id
                  AND s.expires_at > NOW()
                  AND s.deleted_at IS NULL
              ) AS profileHasActiveStory,
              (
                SELECT COUNT(*) > 0
                FROM story_views sv
                INNER JOIN stories s ON s.id = sv.story_id
                WHERE s.profile_id = p.id
                  AND sv.viewer_profile_id = :currentProfileId
                  AND s.deleted_at IS NULL
                  AND s.expires_at > NOW()
              ) AS profileHasViewedStory,
              EXISTS (
                SELECT 1
                FROM likes l
                WHERE l.likeable_type = 'comment'
                  AND l.likeable_id = c.id
                  AND l.profile_id = :currentProfileId
                  AND l.deleted_at IS NULL
              ) AS isLikedByCurrentUser
            FROM comments c
            INNER JOIN profiles p ON p.id = c.profile_id
            WHERE c.id = :commentId
              AND c.deleted_at IS NULL
              AND p.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<CommentFeedProjection> findCommentForViewer(
            @Param("commentId") Long commentId,
            @Param("currentProfileId") Long currentProfileId
    );

    @Query(value = """
            SELECT
              c.id AS id,
              c.post_id AS postId,
              c.profile_id AS profileId,
              c.parent_id AS parentId,
              p.profile_id AS postOwnerProfileId
            FROM comments c
            INNER JOIN posts p ON p.id = c.post_id
            WHERE c.id = :commentId
              AND c.deleted_at IS NULL
              AND p.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<CommentOwnershipProjection> findOwnershipById(@Param("commentId") Long commentId);

    @Query(value = """
            SELECT c.profile_id
            FROM comments c
            WHERE c.id = :commentId
              AND c.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<Long> findAuthorProfileIdById(@Param("commentId") Long commentId);

    @Query(value = """
            SELECT c.likes_count
            FROM comments c
            WHERE c.id = :commentId
              AND c.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<Long> findLikesCountById(@Param("commentId") Long commentId);

    @Modifying
    @Query(value = """
            UPDATE comments
            SET likes_count = GREATEST(0, likes_count + :delta)
            WHERE id = :commentId
            """, nativeQuery = true)
    int adjustLikesCount(@Param("commentId") Long commentId, @Param("delta") long delta);

    @Modifying
    @Query(value = """
            UPDATE posts
            SET comments_count = GREATEST(0, comments_count + :delta)
            WHERE id = :postId
            """, nativeQuery = true)
    int adjustPostCommentsCount(@Param("postId") Long postId, @Param("delta") long delta);

    @Modifying
    @Query(value = """
            UPDATE comments
            SET deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = :commentId
              AND deleted_at IS NULL
            """, nativeQuery = true)
    int softDeleteById(@Param("commentId") Long commentId);
}
