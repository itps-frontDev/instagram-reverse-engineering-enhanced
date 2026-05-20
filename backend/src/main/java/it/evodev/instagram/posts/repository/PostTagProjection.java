package it.evodev.instagram.posts.repository;

import java.time.OffsetDateTime;

/**
 * Projection per i tag di un post.
 * Mantiene il repository indipendente dal DTO esposto al client.
 */
public interface PostTagProjection {
    String getTaggedUsername();
    Integer getXPosition();
    Integer getYPosition();
    OffsetDateTime getCreatedAt();
}
