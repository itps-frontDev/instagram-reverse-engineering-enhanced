package it.evodev.instagram.profile.repository;

import it.evodev.instagram.profile.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProfileEditJpaRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);
    boolean existsByUsernameIgnoreCaseAndDeletedAtIsNullAndIdNot(String username, Long excludedProfileId);

    @Modifying
    @Query(value = """
            UPDATE follows
               SET status = 'accepted',
                   updated_at = NOW()
             WHERE following_profile_id = :profileId
               AND status = 'pending'
               AND deleted_at IS NULL
            """, nativeQuery = true)
    int promotePendingFollowRequestsToAccepted(@Param("profileId") Long profileId);

    @Modifying
    @Query(value = """
            UPDATE profiles
               SET followers_count = followers_count + :amount,
                   updated_at = NOW()
             WHERE id = :profileId
               AND deleted_at IS NULL
            """, nativeQuery = true)
    int incrementFollowersCountById(@Param("profileId") Long profileId, @Param("amount") int amount);

    @Modifying
    @Query(value = """
            UPDATE profiles p
               SET following_count = p.following_count + pending.pending_count,
                   updated_at = NOW()
              FROM (
                    SELECT follower_profile_id, COUNT(*) AS pending_count
                      FROM follows
                     WHERE following_profile_id = :targetProfileId
                       AND status = 'pending'
                       AND deleted_at IS NULL
                     GROUP BY follower_profile_id
                   ) pending
             WHERE p.id = pending.follower_profile_id
               AND p.deleted_at IS NULL
            """, nativeQuery = true)
    int incrementFollowingCountForFollowersOfPendingRequests(@Param("targetProfileId") Long targetProfileId);

    @Query(value = """
            SELECT COUNT(*)
              FROM follows
             WHERE following_profile_id = :profileId
               AND status = 'pending'
               AND deleted_at IS NULL
            """, nativeQuery = true)
    int countPendingFollowRequests(@Param("profileId") Long profileId);
}
