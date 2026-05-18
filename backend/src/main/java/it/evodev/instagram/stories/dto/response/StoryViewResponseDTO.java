package it.evodev.instagram.stories.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StoryViewResponseDTO {
    private boolean success;
    private String message;
}
