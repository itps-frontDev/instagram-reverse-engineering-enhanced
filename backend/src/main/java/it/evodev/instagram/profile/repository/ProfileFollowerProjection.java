package it.evodev.instagram.profile.repository;

public interface ProfileFollowerProjection {
    Long getId();
    String getUsername();
    String getFullName();
    String getProfileImageUrl();
    String getFollowStatus();
}
