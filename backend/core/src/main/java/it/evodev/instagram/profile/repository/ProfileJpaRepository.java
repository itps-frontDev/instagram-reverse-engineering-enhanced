package it.evodev.instagram.profile.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import it.evodev.instagram.profile.models.Profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProfileJpaRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);
    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);

    @Query(value = """
            SELECT
                p.id AS id,
                p.user_id AS userId,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.full_name AS VARCHAR) AS fullName,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                CAST(p.bio AS VARCHAR) AS bio,
                CAST(p.website_url AS VARCHAR) AS websiteUrl,
                p.gender AS gender,
                p.custom_gender AS customGender,
                p.is_private AS isPrivate,
                p.is_verified AS isVerified,
                p.followers_count AS followersCount,
                p.following_count AS followingCount,
                p.posts_count AS postsCount
            FROM profiles p
            WHERE p.user_id = :userId
              AND p.deleted_at IS NULL
            """, nativeQuery = true)
    Optional<MeProfileProjection> findMeProfileByUserId(@Param("userId") UUID userId);

    @Query(value = """
            SELECT
                p.id AS id,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.full_name AS VARCHAR) AS fullName,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                p.is_private AS isPrivate,
                p.followers_count AS followersCount,
                p.following_count AS followingCount,
                p.posts_count AS postsCount
            FROM profiles p
            WHERE p.deleted_at IS NULL
              AND LOWER(p.username) = LOWER(:username)
            """, nativeQuery = true)
    Optional<ProfilePreviewProjection> findProfilePreviewByUsername(@Param("username") String username);

    @Query(value = """
            SELECT
                p.id AS id,
                p.user_id AS userId,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.full_name AS VARCHAR) AS fullName,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                CAST(p.bio AS VARCHAR) AS bio,
                CAST(p.website_url AS VARCHAR) AS websiteUrl,
                p.is_private AS isPrivate,
                p.is_verified AS isVerified,
                p.followers_count AS followersCount,
                p.following_count AS followingCount,
                p.posts_count AS postsCount,
                EXISTS (
                    SELECT 1
                    FROM posts po
                    INNER JOIN post_media pm ON pm.post_id = po.id
                    WHERE po.profile_id = p.id
                      AND pm.media_type = 'video'
                      AND po.deleted_at IS NULL
                      AND pm.deleted_at IS NULL
                ) AS hasReels,
                EXISTS (
                    SELECT 1
                    FROM stories s
                    WHERE s.profile_id = p.id
                      AND s.deleted_at IS NULL
                      AND s.expires_at > NOW()
                ) AS hasAnyActiveStory,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM stories s2
                        WHERE s2.profile_id = p.id
                          AND s2.deleted_at IS NULL
                          AND s2.expires_at > NOW()
                          AND (
                              s2.profile_id = :viewerProfileId
                              OR s2.profile_id IN (
                                  SELECT f.following_profile_id
                                  FROM follows f
                                  WHERE f.follower_profile_id = :viewerProfileId
                                    AND f.status = 'accepted'
                                    AND f.deleted_at IS NULL
                              )
                              OR NOT p.is_private
                          )
                          AND NOT EXISTS (
                              SELECT 1
                              FROM story_views sv2
                              WHERE sv2.story_id = s2.id
                                AND sv2.viewer_profile_id = :viewerProfileId
                          )
                    ) THEN TRUE ELSE FALSE
                END AS hasActiveStory,
                EXISTS (
                    SELECT 1
                    FROM story_views sv
                    INNER JOIN stories s3 ON s3.id = sv.story_id
                    WHERE s3.profile_id = p.id
                      AND sv.viewer_profile_id = :viewerProfileId
                      AND s3.deleted_at IS NULL
                      AND s3.expires_at > NOW()
                ) AS hasViewedStory
            FROM profiles p
            WHERE p.deleted_at IS NULL
              AND LOWER(p.username) = LOWER(:username)
            """, nativeQuery = true)
    Optional<ProfileByUsernameProjection> findProfileByUsernameWithContext(
            @Param("username") String username,
            @Param("viewerProfileId") Long viewerProfileId
    );

    @Query("select p.id from Profile p where p.userId = :userId and p.deletedAt is null")
    Optional<Long> findIdByUserIdAndDeletedAtIsNull(@Param("userId") UUID userId);

    @Modifying
    @Query(value = "UPDATE profiles SET followers_count = followers_count + 1 WHERE id = :profileId", nativeQuery = true)
    void incrementFollowersCount(@Param("profileId") Long profileId);

    @Modifying
    @Query(value = "UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = :profileId", nativeQuery = true)
    void decrementFollowersCount(@Param("profileId") Long profileId);

    @Modifying
    @Query(value = "UPDATE profiles SET following_count = following_count + 1 WHERE id = :profileId", nativeQuery = true)
    void incrementFollowingCount(@Param("profileId") Long profileId);

    @Modifying
    @Query(value = "UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = :profileId", nativeQuery = true)
    void decrementFollowingCount(@Param("profileId") Long profileId);
}
