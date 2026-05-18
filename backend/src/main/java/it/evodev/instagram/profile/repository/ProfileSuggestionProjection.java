package it.evodev.instagram.profile.repository;

/**
 * Projection for profile suggestions.
 * Returns basic profile info with followers count for discovery feature.
 */
public interface ProfileSuggestionProjection {
    Long getId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    Integer getFollowersCount();
}
