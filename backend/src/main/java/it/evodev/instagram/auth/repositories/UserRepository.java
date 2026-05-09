package it.evodev.instagram.auth.repositories;

import it.evodev.instagram.auth.models.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByIdAndDeletedAtIsNull(Long id);

    @Query(value = """
            SELECT u.*
            FROM users u
            LEFT JOIN profiles p
              ON p.user_id = u.id
             AND p.deleted_at IS NULL
            WHERE u.deleted_at IS NULL
              AND (
                LOWER(COALESCE(u.email, '')) = :identifier
                OR LOWER(COALESCE(u.phone_number, '')) = :identifier
                OR LOWER(COALESCE(p.username, '')) = :identifier
              )
            LIMIT 1
            """, nativeQuery = true)
    Optional<User> findByLoginIdentifier(@Param("identifier") String identifier);
}
