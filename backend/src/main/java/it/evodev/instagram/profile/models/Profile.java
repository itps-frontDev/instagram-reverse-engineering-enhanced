package it.evodev.instagram.profile.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
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

    @Column(name = "is_private", nullable = false)
    private Boolean isPrivate;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified;

    @Column(name = "followers_count", nullable = false)
    private Integer followersCount;

    @Column(name = "following_count", nullable = false)
    private Integer followingCount;

    @Column(name = "posts_count", nullable = false)
    private Integer postsCount;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
