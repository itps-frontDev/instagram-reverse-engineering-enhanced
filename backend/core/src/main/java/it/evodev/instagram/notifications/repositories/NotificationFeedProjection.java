package it.evodev.instagram.notifications.repositories;

import java.time.Instant;
import java.util.UUID;

public interface NotificationFeedProjection {
    UUID getId();
    String getType();
    Long getSenderProfileId();
    String getSenderUsername();
    String getSenderFullName();
    String getSenderProfileImageUrl();
    Boolean getSenderIsVerified();
    String getReferenceType();
    Long getReferenceId();
    Long getReferencePostId();
    String getReferenceImageUrl();
    String getReferenceMediaType();
    Boolean getIsRead();
    Instant getCreatedAt();
}
