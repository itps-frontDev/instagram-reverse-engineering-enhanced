package it.evodev.instagram.comments.dto.response;

import java.time.Instant;

public record CommentDataDTO(
        Long id,
        Long postId,
        Long profileId,
        Long parentId,
        String text,
        Long likesCount,
        String createdAt,
        String profileUsername,
        String profileFullName,
        String profileImageUrl,
        boolean profileIsVerified,
        boolean profileHasActiveStory,
        boolean profileHasViewedStory,
        boolean profileIsPrivate,
        boolean isLikedByCurrentUser
) {
    public static CommentDataDTO from(
            Long id,
            Long postId,
            Long profileId,
            Long parentId,
            String text,
            Long likesCount,
            Instant createdAt,
            String profileUsername,
            String profileFullName,
            String profileImageUrl,
            boolean profileIsVerified,
            boolean profileHasActiveStory,
            boolean profileHasViewedStory,
            boolean profileIsPrivate,
            boolean isLikedByCurrentUser
    ) {
        return new CommentDataDTO(
                id,
                postId,
                profileId,
                parentId,
                text,
                likesCount,
                createdAt == null ? null : createdAt.toString(),
                profileUsername,
                profileFullName,
                profileImageUrl,
                profileIsVerified,
                profileHasActiveStory,
                profileHasViewedStory,
                profileIsPrivate,
                isLikedByCurrentUser
        );
    }
}
