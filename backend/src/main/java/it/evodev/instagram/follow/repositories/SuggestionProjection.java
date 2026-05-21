package it.evodev.instagram.follow.repositories;

public interface SuggestionProjection {
    Long getId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    Integer getFollowersCount();
}
