package it.evodev.instagram.posts.dto.response;

import java.time.Instant;
import java.util.List;

public record PostDetailDTO(
    Long id,
    Long profileId,
    String caption,
    Integer likesCount,
    Integer commentsCount,
    Instant createdAt,
    String profileUsername,
    String profileFullName,
    String profileImageUrl,
    Boolean profileIsVerified,
    Boolean profileHasActiveStory,
    Boolean profileHasViewedStory,
    Boolean profileIsPrivate,
    Boolean isLikedByCurrentUser,
    Boolean isSavedByCurrentUser,
    Boolean isFollowingAuthor,
    Boolean hasTags,
    // Restituiamo tutto il carosello per evitare round-trip multipli sul frontend.
    List<PostDetailMediaDTO> media
) {}
