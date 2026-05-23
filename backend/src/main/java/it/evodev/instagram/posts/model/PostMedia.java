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

/**
 * Entità JPA per post_media.
 * Rappresenta un singolo media (immagine o video) in un post.
 * 
 * PK: Long (BigInt) - ID non esposto esternamente
 * Tabella: post_media
 * 
 * Un post può avere più media (carosello). Il position determina l'ordine.
 * 
 * Relazioni:
 * - post_id: ID del post proprietario
 * - media_url: Percorso relativo nel blob storage (es. posts/123/image-1.jpg)
 * - media_type: 'image' o 'video'
 * - position: Ordine nel carosello (0-indexed)
 */
@Entity
@Table(name = "post_media")
@Getter
@Setter
@NoArgsConstructor
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
