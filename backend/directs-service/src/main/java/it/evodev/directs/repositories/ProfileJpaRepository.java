package it.evodev.directs.repositories;

import it.evodev.directs.models.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileJpaRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByUserIdAndDeletedAtIsNull(UUID userId);
}
