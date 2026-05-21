package it.evodev.instagram.feed.repository;

import java.time.Instant;

public interface FeedPostProjection {
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
    Boolean getProfileHasViewedStory();
    Boolean getFollowingAuthor();
    Boolean getLikedByCurrentUser();
    Boolean getSavedByCurrentUser();
    Boolean getHasTags();
}
