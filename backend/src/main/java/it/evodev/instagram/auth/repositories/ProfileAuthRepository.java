package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.auth.models.ProfileModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileAuthRepository extends JpaRepository<ProfileModel, Long> {

    Optional<ProfileModel> findByUsernameIgnoreCaseAndDeletedAtIsNull(String username);

    Optional<ProfileModel> findByUser_IdAndDeletedAtIsNull(Long userId);
}

