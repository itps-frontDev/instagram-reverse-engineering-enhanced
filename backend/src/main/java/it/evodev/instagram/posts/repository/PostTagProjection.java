package it.evodev.instagram.posts.repository;

import java.time.Instant;

/**
 * Projection per i tag di un post.
 * Mantiene il repository indipendente dal DTO esposto al client.
 */
public interface PostTagProjection {
    String getTaggedUsername();
    Double getXPosition();
    Double getYPosition();
    Instant getCreatedAt();
}
