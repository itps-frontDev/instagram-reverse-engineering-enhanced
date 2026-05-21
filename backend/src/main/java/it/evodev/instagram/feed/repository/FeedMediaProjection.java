package it.evodev.instagram.feed.repository;

public interface FeedMediaProjection {
    Long getId();
    Long getPostId();
    String getMediaUrl();
    String getMediaType();
    Integer getDurationSeconds();
    Integer getPosition();
}
