package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.auth.models.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserModel, Long> {

    Optional<UserModel> findByIdAndDeletedAtIsNull(Long id);

    Optional<UserModel> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    Optional<UserModel> findByPhoneNumberAndDeletedAtIsNull(String phoneNumber);
}

