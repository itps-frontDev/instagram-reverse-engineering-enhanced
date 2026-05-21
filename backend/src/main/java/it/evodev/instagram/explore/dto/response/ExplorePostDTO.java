package it.evodev.instagram.explore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ExplorePostDTO {

    @JsonProperty("id")
    private long id;

    @JsonProperty("profile_id")
    private long profile_id;

    @JsonProperty("caption")
    private String caption;

    @JsonProperty("location")
    private String location;

    @JsonProperty("is_comments_disabled")
    private boolean is_comments_disabled;

    @JsonProperty("is_likes_hidden")
    private boolean is_likes_hidden;

    @JsonProperty("likes_count")
    private long likes_count;

    @JsonProperty("comments_count")
    private long comments_count;

    @JsonProperty("created_at")
    private String created_at;

    @JsonProperty("profile_username")
    private String profile_username;

    @JsonProperty("profile_full_name")
    private String profile_full_name;

    @JsonProperty("profile_image_url")
    private String profile_image_url;

    @JsonProperty("profile_is_verified")
    private boolean profile_is_verified;

    @JsonProperty("profile_has_active_story")
    private boolean profile_has_active_story;

    @JsonProperty("profile_has_viewed_story")
    private boolean profile_has_viewed_story;

    @JsonProperty("profile_is_private")
    private boolean profile_is_private;

    @JsonProperty("media")
    private List<ExploreMediaDTO> media;

    @JsonProperty("is_liked_by_current_user")
    private boolean is_liked_by_current_user;

    @JsonProperty("is_saved_by_current_user")
    private boolean is_saved_by_current_user;

    @JsonProperty("is_following_author")
    private boolean is_following_author;

    @JsonProperty("has_tags")
    private boolean has_tags;
}
