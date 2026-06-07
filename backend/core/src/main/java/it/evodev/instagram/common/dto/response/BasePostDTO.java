package it.evodev.instagram.common.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

@Getter
public abstract class BasePostDTO<TMedia> {

    private final long id;

    @JsonProperty("profile_id")
    private final long profileId;

    private final String caption;

    private final String location;

    @JsonProperty("is_comments_disabled")
    private final boolean commentsDisabled;

    @JsonProperty("is_likes_hidden")
    private final boolean likesHidden;

    @JsonProperty("likes_count")
    private final long likesCount;

    @JsonProperty("comments_count")
    private final long commentsCount;

    @JsonProperty("created_at")
    private final String createdAt;

    @JsonProperty("profile_username")
    private final String profileUsername;

    @JsonProperty("profile_full_name")
    private final String profileFullName;

    @JsonProperty("profile_image_url")
    private final String profileImageUrl;

    @JsonProperty("profile_is_verified")
    private final boolean profileVerified;

    @JsonProperty("profile_has_active_story")
    private final boolean profileHasActiveStory;

    @JsonProperty("profile_has_viewed_story")
    private final boolean profileHasViewedStory;

    @JsonProperty("profile_is_private")
    private final boolean profilePrivate;

    private final List<TMedia> media;

    @JsonProperty("is_liked_by_current_user")
    private final boolean likedByCurrentUser;

    @JsonProperty("is_saved_by_current_user")
    private final boolean savedByCurrentUser;

    @JsonProperty("is_following_author")
    private final boolean followingAuthor;

    @JsonProperty("has_tags")
    private final boolean hasTags;

    protected BasePostDTO(
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
            List<TMedia> media,
            boolean likedByCurrentUser,
            boolean savedByCurrentUser,
            boolean followingAuthor,
            boolean hasTags
    ) {
        this.id = id;
        this.profileId = profileId;
        this.caption = caption;
        this.location = location;
        this.commentsDisabled = commentsDisabled;
        this.likesHidden = likesHidden;
        this.likesCount = likesCount;
        this.commentsCount = commentsCount;
        this.createdAt = createdAt;
        this.profileUsername = profileUsername;
        this.profileFullName = profileFullName;
        this.profileImageUrl = profileImageUrl;
        this.profileVerified = profileVerified;
        this.profileHasActiveStory = profileHasActiveStory;
        this.profileHasViewedStory = profileHasViewedStory;
        this.profilePrivate = profilePrivate;
        this.media = media;
        this.likedByCurrentUser = likedByCurrentUser;
        this.savedByCurrentUser = savedByCurrentUser;
        this.followingAuthor = followingAuthor;
        this.hasTags = hasTags;
    }
}
