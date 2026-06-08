package it.evodev.instagram.feed.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FeedMediaDTO {

    private long id;

    @JsonProperty("post_id")
    private long postId;

    @JsonProperty("media_url")
    private String mediaUrl;

    @JsonProperty("media_type")
    private String mediaType;

    @JsonProperty("duration_seconds")
    private Integer durationSeconds;

    private int position;
}
