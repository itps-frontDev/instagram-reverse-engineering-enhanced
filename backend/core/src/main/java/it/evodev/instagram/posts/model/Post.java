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

import java.time.Instant;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "caption")
    private String caption;

    @Column(name = "location")
    private String location;

    @Column(name = "is_comments_disabled", nullable = false)
    private Boolean isCommentsDisabled;

    @Column(name = "is_likes_hidden", nullable = false)
    private Boolean isLikesHidden;

    @Column(name = "likes_count", nullable = false)
    private Integer likesCount;

    @Column(name = "comments_count", nullable = false)
    private Integer commentsCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
