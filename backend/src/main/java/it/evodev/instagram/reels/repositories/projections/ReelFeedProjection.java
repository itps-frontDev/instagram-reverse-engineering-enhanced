package it.evodev.instagram.reels.repositories.projections;

import java.time.Instant;

public interface ReelFeedProjection {
    Long getPostId();
    Long getProfileId();
    String getCaption();
    String getLocation();
    Boolean getIsCommentsDisabled();
    Boolean getIsLikesHidden();
    Integer getLikesCount();
    Integer getCommentsCount();
    Instant getCreatedAt();
    String getProfileUsername();
    String getProfileFullName();
    String getProfileImageUrl();
    Boolean getProfileIsVerified();
    Boolean getIsLiked();
    Boolean getIsSaved();
}
