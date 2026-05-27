package it.evodev.instagram.stories.controller;

import it.evodev.instagram.stories.dto.response.StoryApiResponse;
import it.evodev.instagram.stories.dto.response.StoryCollectionDataDTO;
import it.evodev.instagram.stories.service.StoryReadService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/priv/stories")
@RequiredArgsConstructor
public class StoryReadController {

    private static final Logger logger = LoggerFactory.getLogger(StoryReadController.class);

    private final StoryReadService storyReadService;

    /**
     * GET /api/priv/stories
     * Ritorna il feed stories accessibile all'utente autenticato.
     */
    @GetMapping
    public ResponseEntity<StoryApiResponse<StoryCollectionDataDTO>> getActiveStories(Authentication authentication) {
        logger.info("GET /api/priv/stories - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        StoryCollectionDataDTO response = storyReadService.getActiveStories(currentUserId);

        return ResponseEntity.ok(StoryApiResponse.success(response, "Stories fetched successfully"));
    }

    /**
     * GET /api/priv/stories/profiles/{profileId}
     * Ritorna le stories attive di un profilo, se il viewer ha accesso.
     */
    @GetMapping("/profiles/{profileId}")
    public ResponseEntity<StoryApiResponse<StoryCollectionDataDTO>> getStoriesByProfile(
            @PathVariable Long profileId,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/stories/profiles/{} - User: {}", profileId, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        StoryCollectionDataDTO response = storyReadService.getStoriesByProfile(currentUserId, profileId);

        return ResponseEntity.ok(StoryApiResponse.success(response, "Stories fetched successfully"));
    }
}
