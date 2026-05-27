package it.evodev.instagram.stories.repository;

public interface StoryReadProjection {
    Long getId();
    Long getProfileId();
    String getUsername();
    String getProfileImageUrl();
    Boolean getIsVerified();
    String getMediaUrl();
    String getMediaType();
    Double getDurationSeconds();
    Long getViewsCount();
    String getCreatedAt();
    String getExpiresAt();
    Boolean getIsLikedByMe();
    Boolean getIsViewed();
}
