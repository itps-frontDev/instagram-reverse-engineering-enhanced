package it.evodev.instagram.feed.repository;

import it.evodev.instagram.posts.model.PostSavePost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FeedRepository extends JpaRepository<PostSavePost, Long> {

    @Query(value = """
            SELECT DISTINCT
                p.id AS id,
                p.profile_id AS profileId,
                p.caption AS caption,
                p.location AS location,
                p.is_comments_disabled AS commentsDisabled,
                p.is_likes_hidden AS likesHidden,
                p.likes_count AS likesCount,
                p.comments_count AS commentsCount,
                p.created_at AS createdAt,
                CAST(pr.username AS VARCHAR) AS profileUsername,
                CAST(pr.full_name AS VARCHAR) AS profileFullName,
                CAST(pr.profile_image_url AS VARCHAR) AS profileImageUrl,
                pr.is_verified AS profileVerified,
                pr.is_private AS profilePrivate,
                EXISTS(
                    SELECT 1
                    FROM stories s
                    WHERE s.profile_id = p.profile_id
                      AND s.deleted_at IS NULL
                      AND s.expires_at > NOW()
                      AND (
                        s.profile_id = :currentProfileId
                        OR s.profile_id IN (
                            SELECT f1.following_profile_id
                            FROM follows f1
                            WHERE f1.follower_profile_id = :currentProfileId
                              AND f1.status = 'accepted'
                              AND f1.deleted_at IS NULL
                        )
                        OR NOT EXISTS(
                            SELECT 1
                            FROM story_views sv1
                            WHERE sv1.story_id = s.id
                              AND sv1.viewer_profile_id = :currentProfileId
                        )
                      )
                ) AS profileHasActiveStory,
                CASE
                    WHEN (
                        SELECT COUNT(*)
                        FROM stories s2
                        WHERE s2.profile_id = p.profile_id
                          AND s2.deleted_at IS NULL
                          AND s2.expires_at > NOW()
                    ) = 0 THEN FALSE
                    ELSE (
                        SELECT COUNT(*)
                        FROM stories s3
                        WHERE s3.profile_id = p.profile_id
                          AND s3.deleted_at IS NULL
                          AND s3.expires_at > NOW()
                          AND EXISTS(
                            SELECT 1
                            FROM story_views sv2
                            WHERE sv2.story_id = s3.id
                              AND sv2.viewer_profile_id = :currentProfileId
                          )
                    ) = (
                        SELECT COUNT(*)
                        FROM stories s4
                        WHERE s4.profile_id = p.profile_id
                          AND s4.deleted_at IS NULL
                          AND s4.expires_at > NOW()
                    )
                END AS profileHasViewedStory,
                EXISTS(
                    SELECT 1
                    FROM follows f2
                    WHERE f2.follower_profile_id = :currentProfileId
                      AND f2.following_profile_id = p.profile_id
                      AND f2.status = 'accepted'
                      AND f2.deleted_at IS NULL
                ) AS followingAuthor,
                EXISTS(
                    SELECT 1
                    FROM likes l
                    WHERE l.likeable_type = 'post'
                      AND l.likeable_id = p.id
                      AND l.profile_id = :currentProfileId
                      AND l.deleted_at IS NULL
                ) AS likedByCurrentUser,
                EXISTS(
                    SELECT 1
                    FROM saved_posts sp
                    WHERE sp.post_id = p.id
                      AND sp.profile_id = :currentProfileId
                      AND sp.deleted_at IS NULL
                ) AS savedByCurrentUser,
                EXISTS(
                    SELECT 1
                    FROM post_tags pt
                    WHERE pt.post_id = p.id
                ) AS hasTags
            FROM posts p
            INNER JOIN profiles pr ON pr.id = p.profile_id
            WHERE p.deleted_at IS NULL
              AND pr.deleted_at IS NULL
              AND (
                (p.profile_id = :currentProfileId AND p.id = (
                    SELECT p2.id
                    FROM posts p2
                    WHERE p2.profile_id = :currentProfileId
                      AND p2.deleted_at IS NULL
                    ORDER BY p2.created_at DESC
                    LIMIT 1
                ))
                OR EXISTS(
                    SELECT 1
                    FROM follows f3
                    WHERE f3.follower_profile_id = :currentProfileId
                      AND f3.following_profile_id = p.profile_id
                      AND f3.status = 'accepted'
                      AND f3.deleted_at IS NULL
                )
                OR (pr.is_private = FALSE AND p.profile_id <> :currentProfileId)
              )
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<FeedPostProjection> findFeedPosts(
            @Param("currentProfileId") Long currentProfileId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
            SELECT
                pm.id AS id,
                pm.post_id AS postId,
                CAST(pm.media_url AS VARCHAR) AS mediaUrl,
                CAST(pm.media_type AS VARCHAR) AS mediaType,
                pm.duration_seconds AS durationSeconds,
                pm.position AS position
            FROM post_media pm
            WHERE pm.deleted_at IS NULL
              AND pm.post_id IN (:postIds)
            ORDER BY pm.post_id ASC, pm.position ASC
            """, nativeQuery = true)
    List<FeedMediaProjection> findMediaByPostIds(@Param("postIds") List<Long> postIds);
}
