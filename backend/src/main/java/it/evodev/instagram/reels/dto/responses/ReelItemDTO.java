package it.evodev.instagram.reels.dto.responses;

import java.time.OffsetDateTime;
import java.util.List;

public record ReelItemDTO(
        Long id,
        Long profileId,
        String caption,
        String location,
        Boolean isCommentsDisabled,
        Boolean isLikesHidden,
        Integer likesCount,
        Integer commentsCount,
        OffsetDateTime createdAt,
        String profileUsername,
        String profileFullName,
        String profileImageUrl,
        Boolean profileIsVerified,
        Boolean isLikedByCurrentUser,
        Boolean isSavedByCurrentUser,
        List<ReelMediaItemDTO> media
) {}
