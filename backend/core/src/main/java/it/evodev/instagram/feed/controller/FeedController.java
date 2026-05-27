package it.evodev.instagram.feed.controller;

import it.evodev.instagram.feed.dto.request.FeedRequestDTO;
import it.evodev.instagram.feed.dto.response.FeedApiResponse;
import it.evodev.instagram.feed.dto.response.FeedDataDTO;
import it.evodev.instagram.feed.service.FeedService;
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
@RequestMapping("/api/priv/feed")
@RequiredArgsConstructor
public class FeedController {

    private static final Logger logger = LoggerFactory.getLogger(FeedController.class);

    private final FeedService feedService;

    /**
     * Usiamo GET su /api/priv/feed perché è una lettura idempotente del feed home.
     */
    @GetMapping
    public ResponseEntity<FeedApiResponse<FeedDataDTO>> getFeed(
            Authentication authentication,
            @ModelAttribute FeedRequestDTO request
    ) {
        logger.info("GET /api/priv/feed invoked with limit: {}, offset: {}", request.getLimit(), request.getOffset());
        FeedDataDTO data = feedService.getFeed(authentication.getName(), request);
        logger.info("GET /api/priv/feed completed with posts: {}, hasMore: {}", data.getPosts().size(), data.isHasMore());
        return ResponseEntity.ok(FeedApiResponse.success(data, "Home feed fetched"));
    }
}
