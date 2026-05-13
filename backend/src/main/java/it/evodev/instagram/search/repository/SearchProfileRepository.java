package it.evodev.instagram.search.repository;

import it.evodev.instagram.search.model.SearchProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SearchProfileRepository extends JpaRepository<SearchProfile, Long> {
    Optional<SearchProfile> findByUserIdAndDeletedAtIsNull(UUID userId);
}
