package it.evodev.instagram.explore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExploreMediaDTO {

    @JsonProperty("id")
    private long id;

    @JsonProperty("post_id")
    private long post_id;

    @JsonProperty("media_url")
    private String media_url;

    @JsonProperty("media_type")
    private String media_type;

    @JsonProperty("duration_seconds")
    private Integer duration_seconds;

    @JsonProperty("position")
    private int position;
}
