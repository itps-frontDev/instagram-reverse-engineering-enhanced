package it.evodev.instagram.stories.repository;

import it.evodev.instagram.stories.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StoryReadRepository extends JpaRepository<Story, Long> {

    boolean existsByIdAndDeletedAtIsNullAndExpiresAtAfter(Long id, Instant now);

    @Query("SELECT s.profileId FROM Story s WHERE s.id = :storyId AND s.deletedAt IS NULL")
    Optional<Long> findProfileIdByStoryId(@Param("storyId") Long storyId);

    @Query(value = """
            SELECT
                s.id AS id,
                s.profile_id AS profileId,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                p.is_verified AS isVerified,
                CAST(s.media_url AS VARCHAR) AS mediaUrl,
                CAST(s.media_type AS VARCHAR) AS mediaType,
                s.duration_seconds AS durationSeconds,
                CAST(s.views_count AS BIGINT) AS viewsCount,
                CAST(s.created_at AS VARCHAR) AS createdAt,
                CAST(s.expires_at AS VARCHAR) AS expiresAt,
                EXISTS(
                    SELECT 1
                    FROM likes l
                    WHERE l.likeable_type = 'story'
                      AND l.likeable_id = s.id
                      AND l.profile_id = :viewerProfileId
                      AND l.deleted_at IS NULL
                ) AS isLikedByMe,
                EXISTS(
                    SELECT 1
                    FROM story_views sv
                    WHERE sv.story_id = s.id
                      AND sv.viewer_profile_id = :viewerProfileId
                ) AS isViewed
            FROM stories s
            INNER JOIN profiles p ON p.id = s.profile_id
            WHERE s.deleted_at IS NULL
              AND s.expires_at > NOW()
              AND p.deleted_at IS NULL
              AND (
                s.profile_id = :viewerProfileId
                OR s.profile_id IN (
                    SELECT f.following_profile_id
                    FROM follows f
                    WHERE f.follower_profile_id = :viewerProfileId
                      AND f.status = 'accepted'
                      AND f.deleted_at IS NULL
                )
                OR (NOT p.is_private AND s.profile_id <> :viewerProfileId)
              )
            ORDER BY
                CASE WHEN s.profile_id = :viewerProfileId THEN 0 ELSE 1 END,
                CASE WHEN EXISTS(
                    SELECT 1
                    FROM story_views sv2
                    WHERE sv2.story_id = s.id
                      AND sv2.viewer_profile_id = :viewerProfileId
                ) THEN 1 ELSE 0 END,
                s.created_at DESC
            """, nativeQuery = true)
    List<StoryReadProjection> findActiveStoriesForViewer(@Param("viewerProfileId") Long viewerProfileId);

    @Query(value = """
            SELECT
                s.id AS id,
                s.profile_id AS profileId,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                p.is_verified AS isVerified,
                CAST(s.media_url AS VARCHAR) AS mediaUrl,
                CAST(s.media_type AS VARCHAR) AS mediaType,
                s.duration_seconds AS durationSeconds,
                CAST(s.views_count AS BIGINT) AS viewsCount,
                CAST(s.created_at AS VARCHAR) AS createdAt,
                CAST(s.expires_at AS VARCHAR) AS expiresAt,
                EXISTS(
                    SELECT 1
                    FROM likes l
                    WHERE l.likeable_type = 'story'
                      AND l.likeable_id = s.id
                      AND l.profile_id = :viewerProfileId
                      AND l.deleted_at IS NULL
                ) AS isLikedByMe,
                EXISTS(
                    SELECT 1
                    FROM story_views sv
                    WHERE sv.story_id = s.id
                      AND sv.viewer_profile_id = :viewerProfileId
                ) AS isViewed
            FROM stories s
            INNER JOIN profiles p ON p.id = s.profile_id
            WHERE s.profile_id = :profileId
              AND s.deleted_at IS NULL
              AND s.expires_at > NOW()
              AND p.deleted_at IS NULL
            ORDER BY s.created_at ASC
            """, nativeQuery = true)
    List<StoryReadProjection> findActiveStoriesByProfileId(
            @Param("profileId") Long profileId,
            @Param("viewerProfileId") Long viewerProfileId
    );
}
