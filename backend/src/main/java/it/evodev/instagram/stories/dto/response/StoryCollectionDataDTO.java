package it.evodev.instagram.stories.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class StoryCollectionDataDTO {

    @JsonProperty("stories")
    private List<StoryItemDTO> stories;
}
