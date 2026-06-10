package it.evodev.directs.repositories.projections;

import java.time.Instant;
import java.util.UUID;

public interface ChatWithDetailsProjection {
    UUID getChatId();
    Boolean getIsGroup();
    String getChatName();
    Instant getLastMessageAt();
    String getLastMessageText();
    Long getLastMessageSenderId();
    Long getOtherProfileId();
    String getOtherUsername();
    String getOtherFullName();
    String getOtherProfileImageUrl();
}
