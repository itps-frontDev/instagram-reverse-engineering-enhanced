package it.evodev.instagram.posts.controller;

import it.evodev.instagram.posts.dto.response.PostSaveApiResponse;
import it.evodev.instagram.posts.dto.response.PostSaveDataDTO;
import it.evodev.instagram.posts.service.PostsSaveService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/priv/posts")
@RequiredArgsConstructor
public class PostsSaveController {

    private static final Logger logger = LoggerFactory.getLogger(PostsSaveController.class);

    private final PostsSaveService postsSaveService;

    /**
     * Usiamo POST su /save-toggle perché l'operazione modifica lo stato di persistenza del salvataggio.
     */
    @PostMapping("/{postId}/save-toggle")
    public ResponseEntity<PostSaveApiResponse<PostSaveDataDTO>> toggleSave(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        logger.info("POST /api/priv/posts/{}/save-toggle - request received", postId);
        PostSaveDataDTO data = postsSaveService.toggleSave(authentication.getName(), postId);
        logger.info("POST /api/priv/posts/{}/save-toggle - completed with saved={}", postId, data.saved());

        return ResponseEntity.ok(PostSaveApiResponse.success(data, "Post save status updated"));
    }
}
