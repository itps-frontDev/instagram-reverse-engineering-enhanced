package it.evodev.instagram.explore.controller;

import it.evodev.instagram.explore.dto.request.ExploreRequestDTO;
import it.evodev.instagram.explore.dto.response.ExploreApiResponse;
import it.evodev.instagram.explore.dto.response.ExploreFeedDataDTO;
import it.evodev.instagram.explore.service.ExploreService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/priv/explore")
@RequiredArgsConstructor
public class ExploreController {

    private static final Logger logger = LoggerFactory.getLogger(ExploreController.class);

    private final ExploreService exploreService;

    /**
     * Usiamo GET su /api/priv/explore perché è una lettura idempotente del feed esplora.
     */
    @GetMapping
    public ResponseEntity<ExploreApiResponse<ExploreFeedDataDTO>> getExplore(
            Authentication authentication,
            @ModelAttribute ExploreRequestDTO request
    ) {
        logger.info("GET /api/priv/explore invoked with limit: {}, offset: {}", request.getLimit(), request.getOffset());
        ExploreFeedDataDTO data = exploreService.getExplore(authentication.getName(), request);
        logger.info("GET /api/priv/explore completed with posts: {}, hasMore: {}", data.getPosts().size(), data.isHasMore());
        return ResponseEntity.ok(ExploreApiResponse.success(data, "Explore feed fetched"));
    }
}

