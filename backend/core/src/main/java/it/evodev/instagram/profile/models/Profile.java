package it.evodev.instagram.profile.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID userId;

    @Column(nullable = false, columnDefinition = "citext")
    private String username;

    @Column(name = "full_name", length = 64)
    private String fullName;

    @Column(name = "bio", length = 150)
    private String bio;

    @Column(name = "website_url", length = 100)
    private String websiteUrl;

    @Column(name = "gender")
    private String gender;

    @Column(name = "custom_gender")
    private String customGender;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    // Default a livello entità: alla registrazione si crea `new Profile()` e si
    // valorizzano solo userId/username/fullName. Senza questi inizializzatori
    // Hibernate inserirebbe NULL esplicito su queste colonne NOT NULL (il
    // DEFAULT del DB non scatta su un NULL esplicito), facendo fallire l'INSERT.
    @Column(name = "is_private", nullable = false)
    private Boolean isPrivate = false;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "followers_count", nullable = false)
    private Integer followersCount = 0;

    @Column(name = "following_count", nullable = false)
    private Integer followingCount = 0;

    @Column(name = "posts_count", nullable = false)
    private Integer postsCount = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
