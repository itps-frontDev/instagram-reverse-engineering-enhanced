package it.evodev.instagram.search.repository;

import it.evodev.instagram.search.model.SearchProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SearchProfileRepository extends JpaRepository<SearchProfile, Long> {
    Optional<SearchProfile> findByUserIdAndDeletedAtIsNull(UUID userId);

    @Query(value = """
            SELECT
                p.user_id AS uuid,
                p.username AS username,
                p.full_name AS fullName,
                p.profile_image_url AS profileImageUrl,
                p.is_verified AS verified,
                p.is_private AS privateProfile,
                p.followers_count AS followersCount,
                EXISTS(
                    SELECT 1
                    FROM follows f
                    WHERE f.follower_profile_id = :currentProfileId
                      AND f.following_profile_id = p.id
                      AND f.status = 'accepted'
                      AND f.deleted_at IS NULL
                ) AS following
            FROM profiles p
            WHERE p.deleted_at IS NULL
              AND p.id <> :currentProfileId
              AND (
                  LOWER(p.username) LIKE :searchTerm
                  OR LOWER(COALESCE(p.full_name, '')) LIKE :searchTerm
              )
            ORDER BY
                CASE
                    WHEN LOWER(p.username) = :exactQuery THEN 0
                    WHEN LOWER(p.username) LIKE :startsWithQuery THEN 1
                    ELSE 2
                END,
                p.followers_count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<SearchAccountProjection> searchAccounts(
            @Param("searchTerm") String searchTerm,
            @Param("exactQuery") String exactQuery,
            @Param("startsWithQuery") String startsWithQuery,
            @Param("currentProfileId") Long currentProfileId,
            @Param("limit") int limit
    );
}
