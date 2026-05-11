package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.auth.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);
    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);
}
