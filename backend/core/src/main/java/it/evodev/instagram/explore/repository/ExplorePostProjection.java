package it.evodev.instagram.explore.repository;

import java.time.Instant;

public interface ExplorePostProjection {
    Long getId();
    Long getProfileId();
    String getCaption();
    String getLocation();
    Boolean getCommentsDisabled();
    Boolean getLikesHidden();
    Long getLikesCount();
    Long getCommentsCount();
    Instant getCreatedAt();
    String getProfileUsername();
    String getProfileFullName();
    String getProfileImageUrl();
    Boolean getProfileVerified();
    Boolean getProfilePrivate();
    Boolean getProfileHasActiveStory();
    Boolean getFollowingAuthor();
    Boolean getLikedByCurrentUser();
    Boolean getSavedByCurrentUser();
    Boolean getHasTags();
}
