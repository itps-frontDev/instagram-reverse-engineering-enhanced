package it.evodev.instagram.explore.repository;

import it.evodev.instagram.posts.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExploreRepository extends JpaRepository<Post, Long> {

    @Query(value = """
            SELECT
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
                    WHERE s.profile_id = pr.id
                      AND s.deleted_at IS NULL
                      AND s.expires_at > NOW()
                ) AS profileHasActiveStory,
                EXISTS(
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_profile_id = :currentProfileId
                      AND f.following_profile_id = pr.id
                      AND f.status = 'accepted'
                      AND f.deleted_at IS NULL
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
              AND pr.is_private = FALSE
              AND p.profile_id <> :currentProfileId
            ORDER BY
                (p.likes_count * 3 + p.comments_count * 5) DESC,
                p.created_at DESC,
                p.id DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<ExplorePostProjection> findExplorePosts(
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
    List<ExploreMediaProjection> findMediaByPostIds(@Param("postIds") List<Long> postIds);
}
