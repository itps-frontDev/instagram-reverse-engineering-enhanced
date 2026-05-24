package it.evodev.instagram.profile.repository;

import java.util.UUID;

public interface MeProfileProjection {
    Long getId();
    UUID getUserId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    String getBio();
    String getWebsiteUrl();
    Boolean getIsPrivate();
    Boolean getIsVerified();
    Integer getFollowersCount();
    Integer getFollowingCount();
    Integer getPostsCount();
}
