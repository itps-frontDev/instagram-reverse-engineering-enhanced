package it.evodev.instagram.common.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

@Getter
public abstract class BasePostDTO<TMedia> {

    @JsonProperty("id")
    private final long id;

    @JsonProperty("profile_id")
    private final long profile_id;

    @JsonProperty("caption")
    private final String caption;

    @JsonProperty("location")
    private final String location;

    @JsonProperty("is_comments_disabled")
    private final boolean is_comments_disabled;

    @JsonProperty("is_likes_hidden")
    private final boolean is_likes_hidden;

    @JsonProperty("likes_count")
    private final long likes_count;

    @JsonProperty("comments_count")
    private final long comments_count;

    @JsonProperty("created_at")
    private final String created_at;

    @JsonProperty("profile_username")
    private final String profile_username;

    @JsonProperty("profile_full_name")
    private final String profile_full_name;

    @JsonProperty("profile_image_url")
    private final String profile_image_url;

    @JsonProperty("profile_is_verified")
    private final boolean profile_is_verified;

    @JsonProperty("profile_has_active_story")
    private final boolean profile_has_active_story;

    @JsonProperty("profile_has_viewed_story")
    private final boolean profile_has_viewed_story;

    @JsonProperty("profile_is_private")
    private final boolean profile_is_private;

    @JsonProperty("media")
    private final List<TMedia> media;

    @JsonProperty("is_liked_by_current_user")
    private final boolean is_liked_by_current_user;

    @JsonProperty("is_saved_by_current_user")
    private final boolean is_saved_by_current_user;

    @JsonProperty("is_following_author")
    private final boolean is_following_author;

    @JsonProperty("has_tags")
    private final boolean has_tags;

    protected BasePostDTO(
            long id,
            long profile_id,
            String caption,
            String location,
            boolean is_comments_disabled,
            boolean is_likes_hidden,
            long likes_count,
            long comments_count,
            String created_at,
            String profile_username,
            String profile_full_name,
            String profile_image_url,
            boolean profile_is_verified,
            boolean profile_has_active_story,
            boolean profile_has_viewed_story,
            boolean profile_is_private,
            List<TMedia> media,
            boolean is_liked_by_current_user,
            boolean is_saved_by_current_user,
            boolean is_following_author,
            boolean has_tags
    ) {
        this.id = id;
        this.profile_id = profile_id;
        this.caption = caption;
        this.location = location;
        this.is_comments_disabled = is_comments_disabled;
        this.is_likes_hidden = is_likes_hidden;
        this.likes_count = likes_count;
        this.comments_count = comments_count;
        this.created_at = created_at;
        this.profile_username = profile_username;
        this.profile_full_name = profile_full_name;
        this.profile_image_url = profile_image_url;
        this.profile_is_verified = profile_is_verified;
        this.profile_has_active_story = profile_has_active_story;
        this.profile_has_viewed_story = profile_has_viewed_story;
        this.profile_is_private = profile_is_private;
        this.media = media;
        this.is_liked_by_current_user = is_liked_by_current_user;
        this.is_saved_by_current_user = is_saved_by_current_user;
        this.is_following_author = is_following_author;
        this.has_tags = has_tags;
    }
}
