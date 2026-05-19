package it.evodev.instagram.posts.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "saved_posts")
@Getter
@Setter
@NoArgsConstructor
public class PostSaveSavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    public boolean isActive() {
        return deletedAt == null;
    }

    public void toggle() {
        if (isActive()) {
            deletedAt = OffsetDateTime.now();
            return;
        }
        deletedAt = null;
    }

    public static PostSaveSavedPost create(Long profileId, Long postId) {
        PostSaveSavedPost entity = new PostSaveSavedPost();
        entity.setProfileId(profileId);
        entity.setPostId(postId);
        entity.setDeletedAt(null);
        return entity;
    }
}
