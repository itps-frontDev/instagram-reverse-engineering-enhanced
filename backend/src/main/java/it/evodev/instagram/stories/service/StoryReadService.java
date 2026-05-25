package it.evodev.instagram.stories.service;

import it.evodev.instagram.stories.dto.response.StoryCollectionDataDTO;

import java.util.UUID;

public interface StoryReadService {
    StoryCollectionDataDTO getActiveStories(UUID currentUserId);

    StoryCollectionDataDTO getStoriesByProfile(UUID currentUserId, Long profileId);
}
