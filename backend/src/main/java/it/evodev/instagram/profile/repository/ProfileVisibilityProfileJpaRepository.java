package it.evodev.instagram.profile.repository;

import it.evodev.instagram.profile.model.ProfileVisibilityProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileVisibilityProfileJpaRepository extends JpaRepository<ProfileVisibilityProfile, Long> {
    Optional<ProfileVisibilityProfile> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);
    Optional<ProfileVisibilityProfile> findByUserIdAndDeletedAtIsNull(UUID userId);
}
