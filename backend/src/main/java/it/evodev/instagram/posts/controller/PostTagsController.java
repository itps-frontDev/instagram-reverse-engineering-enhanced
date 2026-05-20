package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.response.PostTagDTO;
import it.evodev.instagram.posts.dto.response.PostApiResponse;
import it.evodev.instagram.posts.service.PostTagService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller per i tag dei post.
 * 
 * Endpoint:
 * - GET /api/priv/posts/{postId}/tags - Ottiene tutti i tag di un post
 */
@RestController
@RequestMapping("/api/priv/posts")
@RequiredArgsConstructor
public class PostTagsController {

    private static final Logger logger = LoggerFactory.getLogger(PostTagsController.class);

    private final PostTagService postTagService;

    /**
     * GET /api/priv/posts/{postId}/tags
     * 
     * Usiamo GET perché l'operazione è una lettura (idempotent, no state change).
     * Ritorna una lista di tag (PostTagDTO) associati a un post.
     * 
     * Richiede autenticazione (Spring Security valida via JWT nel header Authorization).
     * L'utente può visualizzare i tag di un post se può vedere il post
     * (è il proprietario o il post è pubblico).
     * 
     * @param postId ID del post
     * @param authentication Autenticazione Spring Security (estratta automaticamente)
     * @return ResponseEntity con lista di tag
     */
    @GetMapping("/{postId}/tags")
    public ResponseEntity<PostApiResponse<List<PostTagDTO>>> getPostTags(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        logger.info("GET /api/priv/posts/{}/tags - request from user: {}", postId, username);

        List<PostTagDTO> tags = postTagService.getTagsByPostId(postId, username);

        logger.info("GET /api/priv/posts/{}/tags - completed with {} tags for user: {}", postId, tags.size(), username);

        return ResponseEntity.ok(PostApiResponse.success(tags, "Tags retrieved successfully"));
    }
}
