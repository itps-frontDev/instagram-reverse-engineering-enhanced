package it.evodev.instagram.explore.dto.response;

import it.evodev.instagram.common.dto.response.BasePostDTO;

import java.util.List;

public class ExplorePostDTO extends BasePostDTO<ExploreMediaDTO> {
    public ExplorePostDTO(
            long id,
            long profileId,
            String caption,
            String location,
            boolean commentsDisabled,
            boolean likesHidden,
            long likesCount,
            long commentsCount,
            String createdAt,
            String profileUsername,
            String profileFullName,
            String profileImageUrl,
            boolean profileVerified,
            boolean profileHasActiveStory,
            boolean profileHasViewedStory,
            boolean profilePrivate,
            List<ExploreMediaDTO> media,
            boolean likedByCurrentUser,
            boolean savedByCurrentUser,
            boolean followingAuthor,
            boolean hasTags
    ) {
        super(
                id,
                profileId,
                caption,
                location,
                commentsDisabled,
                likesHidden,
                likesCount,
                commentsCount,
                createdAt,
                profileUsername,
                profileFullName,
                profileImageUrl,
                profileVerified,
                profileHasActiveStory,
                profileHasViewedStory,
                profilePrivate,
                media,
                likedByCurrentUser,
                savedByCurrentUser,
                followingAuthor,
                hasTags
        );
    }
}
