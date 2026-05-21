package it.evodev.instagram.explore.repository;

public interface ExploreMediaProjection {
    Long getId();
    Long getPostId();
    String getMediaUrl();
    String getMediaType();
    Integer getDurationSeconds();
    Integer getPosition();
}

