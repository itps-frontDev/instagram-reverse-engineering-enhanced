package it.evodev.instagram.search.repository;

import java.util.UUID;

public interface SearchAccountProjection {
    UUID getUuid();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    Boolean getVerified();
    Boolean getPrivateProfile();
    Integer getFollowersCount();
    Boolean getFollowing();
}
