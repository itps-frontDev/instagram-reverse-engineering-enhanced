package it.evodev.instagram.profile.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
public class ProfileEditProfile {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "username", nullable = false, columnDefinition = "citext")
    private String username;

    @Column(name = "bio", length = 150)
    private String bio;

    @Column(name = "website_url", length = 100)
    private String websiteUrl;

    @Column(name = "gender")
    private String gender;

    @Column(name = "custom_gender")
    private String customGender;

    @Column(name = "is_private", nullable = false)
    private Boolean isPrivate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
