package it.evodev.instagram.stories.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StoryItemDTO {

    private Long id;

    @JsonProperty("profile_id")
    private Long profileId;

    private String username;

    @JsonProperty("profile_image_url")
    private String profileImageUrl;

    @JsonProperty("is_verified")
    private boolean verified;

    @JsonProperty("media_url")
    private String mediaUrl;

    @JsonProperty("media_type")
    private String mediaType;

    @JsonProperty("duration_seconds")
    private Double durationSeconds;

    @JsonProperty("views_count")
    private Long viewsCount;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("expires_at")
    private String expiresAt;

    @JsonProperty("is_liked_by_me")
    private boolean likedByMe;

    @JsonProperty("is_viewed")
    private boolean viewed;
}
