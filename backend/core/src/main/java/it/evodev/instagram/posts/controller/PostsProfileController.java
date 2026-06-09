package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.response.PostApiResponse;
import it.evodev.instagram.posts.dto.response.ProfilePostsResponseDTO;
import it.evodev.instagram.posts.service.PostsProfileService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class PostsProfileController {

    private static final Logger logger = LoggerFactory.getLogger(PostsProfileController.class);

    private final PostsProfileService postsProfileService;

    @GetMapping("/{username}/posts")
    public ResponseEntity<PostApiResponse<ProfilePostsResponseDTO>> getProfilePosts(
        @PathVariable String username,
        @RequestParam(defaultValue = "posts") String tab,
        @RequestParam(defaultValue = "0") int page,
        Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{}/posts - tab: {}, page: {}", username, tab, page);
        ProfilePostsResponseDTO response = postsProfileService.getProfilePosts(
            authentication.getName(),
            username,
            tab,
            page
        );
        logger.info("GET /api/priv/profiles/{}/posts - count: {}, hasMore: {}", username, response.posts().size(), response.hasMore());
        return ResponseEntity.ok(PostApiResponse.success(response, "Posts retrieved successfully"));
    }
}
