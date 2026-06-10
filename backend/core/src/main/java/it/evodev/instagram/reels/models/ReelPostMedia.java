package it.evodev.instagram.reels.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "post_media")
@Getter
@Setter
@NoArgsConstructor
public class ReelPostMedia {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    @Column(name = "media_type", nullable = false)
    private String mediaType;

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
