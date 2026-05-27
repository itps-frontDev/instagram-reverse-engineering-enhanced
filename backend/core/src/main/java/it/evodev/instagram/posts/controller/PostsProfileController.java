package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.response.PostApiResponse;
import it.evodev.instagram.posts.dto.response.ProfilePostsResponseDTO;
import it.evodev.instagram.posts.service.PostsProfileService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller per recuperare i post di un profilo.
 * 
 * Endpoint pubblico (protetto da autenticazione) che fornisce i post di un profilo
 * con supporto a 4 tab: posts, reels, saved, tagged.
 * 
 * La logica di privacy (verifica se l'utente può visualizzare il profilo) è gestita dal service.
 */
@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class PostsProfileController {

    private static final Logger logger = LoggerFactory.getLogger(PostsProfileController.class);

    private final PostsProfileService postsProfileService;

    /**
     * GET /api/priv/profiles/{username}/posts
     * 
     * Recupera i post di un profilo con supporto a tab e paginazione.
     * 
     * LOGICA:
     * - Username risolve il profilo target
     * - tab filtra per tipo: 'posts' (default), 'reels', 'saved', 'tagged'
     * - page è 0-indexed per paginazione
     * - Verifica privacy tramite ProfileVisibilityService nel service
     * - Tab 'saved' accessibile solo dall'owner del profilo
     * 
     * RISPOSTA (200 OK):
     * {
     *   "success": true,
     *   "data": {
     *     "posts": [{ id, caption, likesCount, commentsCount, createdAt, mediaUrl, mediaType, mediaCount }, ...],
     *     "hasMore": boolean,
     *     "total": number
     *   },
     *   "message": "Posts retrieved successfully"
     * }
     * 
     * ERRORI:
     * - 404 ProfileNotFoundException: profilo target non trovato
     * - 403 UnauthorizedException: accesso negato (profilo privato) o tab 'saved' non owner
     * - 401 PostSaveUnauthorizedException: autenticazione fallita
     * 
     * @param username Username del profilo di cui recuperare i post
     * @param tab Tipo di post: 'posts' | 'reels' | 'saved' | 'tagged' (default: 'posts')
     * @param page Numero pagina 0-indexed (default: 0)
     * @param authentication Spring Security authentication con UUID nel getName()
     * @return ResponseEntity con PostApiResponse<ProfilePostsResponseDTO>
     */
    @GetMapping("/{username}/posts")
    public ResponseEntity<PostApiResponse<ProfilePostsResponseDTO>> getProfilePosts(
        @PathVariable String username,
        @RequestParam(defaultValue = "posts") String tab,
        @RequestParam(defaultValue = "0") int page,
        Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{}/posts - Request received. Tab: {}, Page: {}", 
            username, tab, page);

        // Valida tab
        if (!tab.matches("^(posts|reels|saved|tagged)$")) {
            logger.warn("Invalid tab parameter: {}", tab);
            return ResponseEntity.badRequest()
                .body(PostApiResponse.error("INVALID_TAB", "Invalid tab. Must be: posts, reels, saved, or tagged"));
        }

        // Valida page
        if (page < 0) {
            logger.warn("Invalid page parameter: {}", page);
            return ResponseEntity.badRequest()
                .body(PostApiResponse.error("INVALID_PAGE", "Page must be >= 0"));
        }

        try {
            // Estrai authSubject da authentication
            String authSubject = authentication.getName();

            // Delega al service
            ProfilePostsResponseDTO response = postsProfileService.getProfilePosts(
                authSubject,
                username,
                tab,
                page
            );

            logger.info("GET /api/priv/profiles/{}/posts - Completed. Posts count: {}, HasMore: {}", 
                username, response.posts().size(), response.hasMore());

            return ResponseEntity.ok(
                PostApiResponse.success(response, "Posts retrieved successfully")
            );

        } catch (Exception e) {
            // Exception handling delegato a @ControllerAdvice
            logger.error("GET /api/priv/profiles/{}/posts - Error: {}", username, e.getMessage(), e);
            throw e;
        }
    }
}
