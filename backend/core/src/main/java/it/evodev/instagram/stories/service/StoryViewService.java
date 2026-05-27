package it.evodev.instagram.stories.service;

import it.evodev.instagram.stories.dto.response.StoryViewResponseDTO;

import java.util.UUID;

public interface StoryViewService {
    StoryViewResponseDTO registerView(UUID authSubjectUuid, Long storyId);
}
