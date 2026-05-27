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
 * Entità JPA per post_tags.
 * Rappresenta un tag di un profilo in una foto di un post.
 * 
 * PK: Long (BigInt) - ID non esposto esternamente
 * Tabella: post_tags
 * 
 * Relazioni:
 * - post_id: ID del post taggato
 * - tagged_profile_id: ID del profilo taggato
 * - post_media_id: ID della media (immagine/video) contenente il tag
 * - x_position, y_position: Coordinate di posizionamento del tag sulla foto
 */
@Entity
@Table(name = "post_tags")
@Getter
@Setter
@NoArgsConstructor
public class PostTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "post_media_id")
    private Long postMediaId;

    @Column(name = "tagged_profile_id", nullable = false)
    private Long taggedProfileId;

    @Column(name = "x_position", nullable = false)
    private Double xPosition;

    @Column(name = "y_position", nullable = false)
    private Double yPosition;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
