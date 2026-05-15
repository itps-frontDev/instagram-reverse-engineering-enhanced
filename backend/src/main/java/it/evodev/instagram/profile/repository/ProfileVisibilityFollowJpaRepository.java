package it.evodev.instagram.profile.repository;

import it.evodev.instagram.profile.model.ProfileVisibilityFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProfileVisibilityFollowJpaRepository extends JpaRepository<ProfileVisibilityFollow, Long> {
    Optional<ProfileVisibilityFollow> findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(Long followerProfileId, Long followingProfileId);

    @Query(value = """
            SELECT
                p.id AS id,
                CAST(p.username AS VARCHAR) AS username,
                CAST(p.full_name AS VARCHAR) AS fullName,
                CAST(p.profile_image_url AS VARCHAR) AS profileImageUrl,
                COALESCE((
                    SELECT f2.status
                    FROM follows f2
                    WHERE f2.follower_profile_id = :viewerProfileId
                      AND f2.following_profile_id = p.id
                      AND f2.deleted_at IS NULL
                    ORDER BY f2.updated_at DESC
                    LIMIT 1
                ), 'none') AS followStatus
            FROM follows f
            INNER JOIN profiles p ON p.id = f.follower_profile_id
            WHERE f.following_profile_id = :targetProfileId
              AND f.status = 'accepted'
              AND f.deleted_at IS NULL
              AND p.deleted_at IS NULL
            ORDER BY f.created_at DESC
            """, nativeQuery = true)
    List<ProfileFollowerProjection> findFollowersWithViewerStatus(
            @Param("targetProfileId") Long targetProfileId,
            @Param("viewerProfileId") Long viewerProfileId
    );
}
