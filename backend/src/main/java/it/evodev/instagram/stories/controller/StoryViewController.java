package it.evodev.instagram.stories.controller;

import it.evodev.instagram.stories.dto.response.StoryViewResponseDTO;
import it.evodev.instagram.stories.service.StoryViewService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/priv/stories")
@RequiredArgsConstructor
public class StoryViewController {

    private static final Logger logger = LoggerFactory.getLogger(StoryViewController.class);

    private final StoryViewService storyViewService;

    /**
     * POST /api/priv/stories/{storyId}/view
     * Il path esprime una mutazione puntuale sulla risorsa story: registra la visualizzazione in modo idempotente.
     */
    @PostMapping("/{storyId}/view")
    public ResponseEntity<StoryViewResponseDTO> registerStoryView(
            @PathVariable Long storyId,
            Authentication authentication
    ) {
        logger.info("POST /api/priv/stories/{}/view - request received", storyId);

        StoryViewResponseDTO response = storyViewService.registerView(
                UUID.fromString(authentication.getName()),
                storyId
        );

        logger.info("POST /api/priv/stories/{}/view - request completed", storyId);
        return ResponseEntity.ok(response);
    }
}
