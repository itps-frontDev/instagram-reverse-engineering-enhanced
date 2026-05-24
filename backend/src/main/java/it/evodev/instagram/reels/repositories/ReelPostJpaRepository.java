package it.evodev.instagram.reels.repositories;

import it.evodev.instagram.reels.models.ReelPost;
import it.evodev.instagram.reels.repositories.projections.ReelFeedProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReelPostJpaRepository extends JpaRepository<ReelPost, Long> {

    @Query(value = """
            SELECT
                p.id                    AS postId,
                p.profile_id            AS profileId,
                CAST(p.caption AS VARCHAR)            AS caption,
                CAST(p.location AS VARCHAR)           AS location,
                p.is_comments_disabled                AS isCommentsDisabled,
                p.is_likes_hidden                     AS isLikesHidden,
                p.likes_count                         AS likesCount,
                p.comments_count                      AS commentsCount,
                p.created_at                          AS createdAt,
                CAST(pr.username AS VARCHAR)          AS profileUsername,
                CAST(pr.full_name AS VARCHAR)         AS profileFullName,
                CAST(pr.profile_image_url AS VARCHAR) AS profileImageUrl,
                pr.is_verified          AS profileIsVerified,
                EXISTS (
                    SELECT 1 FROM likes l
                    WHERE l.likeable_type = 'post' AND l.likeable_id = p.id
                      AND l.profile_id = :currentProfileId AND l.deleted_at IS NULL
                ) AS isLiked,
                EXISTS (
                    SELECT 1 FROM saved_posts sp
                    WHERE sp.post_id = p.id AND sp.profile_id = :currentProfileId
                      AND sp.deleted_at IS NULL
                ) AS isSaved
            FROM posts p
            INNER JOIN profiles pr ON p.profile_id = pr.id
            WHERE p.deleted_at IS NULL
              AND pr.deleted_at IS NULL
              AND p.id NOT IN (:excludeIds)
              AND EXISTS (
                  SELECT 1 FROM post_media pm
                  WHERE pm.post_id = p.id AND pm.media_type = 'video' AND pm.deleted_at IS NULL
              )
              AND (
                  NOT pr.is_private
                  OR pr.id = :currentProfileId
                  OR EXISTS (
                      SELECT 1 FROM follows f
                      WHERE f.follower_profile_id = :currentProfileId
                        AND f.following_profile_id = pr.id
                        AND f.status = 'accepted' AND f.deleted_at IS NULL
                  )
              )
            ORDER BY RANDOM()
            LIMIT :limit
            """, nativeQuery = true)
    List<ReelFeedProjection> findReelFeed(
            @Param("currentProfileId") Long currentProfileId,
            @Param("limit") int limit,
            @Param("excludeIds") List<Long> excludeIds
    );
}
