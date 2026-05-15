package it.evodev.instagram.profile.repository;

import it.evodev.instagram.profile.model.ProfileEditProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileEditProfileJpaRepository extends JpaRepository<ProfileEditProfile, Long> {
    Optional<ProfileEditProfile> findByUserIdAndDeletedAtIsNull(UUID userId);
    boolean existsByUsernameIgnoreCaseAndDeletedAtIsNullAndIdNot(String username, Long excludedProfileId);
}
