package it.evodev.instagram.profile.repository;

public interface ProfilePreviewProjection {
    Long getId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    Boolean getIsPrivate();
    Integer getFollowersCount();
    Integer getFollowingCount();
    Integer getPostsCount();
}
