package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.auth.models.Profile;
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

    @Modifying
    @Transactional
    @Query("UPDATE Profile p SET p.profileImageUrl = :url WHERE p.id = :id")
    void updateProfileImageUrl(@Param("id") Long id, @Param("url") String url);
}
