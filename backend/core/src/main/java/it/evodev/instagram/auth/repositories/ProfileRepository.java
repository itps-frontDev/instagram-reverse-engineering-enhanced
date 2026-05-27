package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.profile.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);
    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);

    @Query("select p.id from Profile p where p.userId = :userId and p.deletedAt is null")
    Optional<Long> findIdByUserIdAndDeletedAtIsNull(@Param("userId") UUID userId);

    @Modifying
    @Transactional
    @Query("UPDATE Profile p SET p.profileImageUrl = :url WHERE p.id = :id")
    void updateProfileImageUrl(@Param("id") Long id, @Param("url") String url);

    @Modifying
    @Transactional
    @Query("UPDATE Profile p SET p.postsCount = p.postsCount + 1 WHERE p.id = :id")
    void incrementPostsCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Profile p SET p.postsCount = GREATEST(p.postsCount - 1, 0) WHERE p.id = :id")
    void decrementPostsCount(@Param("id") Long id);
}
