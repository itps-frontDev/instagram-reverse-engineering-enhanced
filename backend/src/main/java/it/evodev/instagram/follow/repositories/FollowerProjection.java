package it.evodev.instagram.follow.repositories;

public interface FollowerProjection {
    Long getId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    String getFollowStatus();
}
