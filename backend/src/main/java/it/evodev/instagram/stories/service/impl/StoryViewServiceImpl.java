package it.evodev.instagram.stories.service.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.stories.dto.response.StoryViewResponseDTO;
import it.evodev.instagram.stories.exception.StoryNotFoundOrNotAccessibleException;
import it.evodev.instagram.stories.exception.StoryViewValidationException;
import it.evodev.instagram.stories.repository.StoryViewRepository;
import it.evodev.instagram.stories.service.StoryViewService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoryViewServiceImpl implements StoryViewService {

    private static final Logger logger = LoggerFactory.getLogger(StoryViewServiceImpl.class);

    private final ProfileRepository profileRepository;
    private final StoryViewRepository storyViewRepository;

    @Override
    @Transactional
    public StoryViewResponseDTO registerView(UUID authSubjectUuid, Long storyId) {
        if (storyId == null || storyId <= 0) {
            throw new StoryViewValidationException("Story id must be a positive number.");
        }

        Long viewerProfileId = profileRepository
                .findIdByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .orElseThrow(() -> new StoryViewValidationException("Authenticated profile not found."));

        logger.info("Story view registration started - storyId: {}, viewerProfileId: {}", storyId, viewerProfileId);

        boolean accessible = storyViewRepository.existsAccessibleActiveStory(storyId, viewerProfileId);
        if (!accessible) {
            logger.warn("Story view denied because story is not accessible - storyId: {}, viewerProfileId: {}",
                    storyId, viewerProfileId);
            throw new StoryNotFoundOrNotAccessibleException("Story not found or not accessible.");
        }

        int insertedRows = storyViewRepository.insertStoryViewIfAbsent(storyId, viewerProfileId);
        if (insertedRows > 0) {
            storyViewRepository.incrementViewsCount(storyId);
            logger.info("Story view registration completed - new view stored - storyId: {}, viewerProfileId: {}",
                    storyId, viewerProfileId);
            return new StoryViewResponseDTO(true, "View registered successfully.");
        }

        logger.info("Story view registration completed - already viewed - storyId: {}, viewerProfileId: {}",
                storyId, viewerProfileId);
        return new StoryViewResponseDTO(true, "Story already viewed.");
    }
}
