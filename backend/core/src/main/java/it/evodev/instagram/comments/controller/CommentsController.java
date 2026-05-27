package it.evodev.instagram.comments.controller;

import it.evodev.instagram.comments.dto.request.CommentCreateRequestDTO;
import it.evodev.instagram.comments.dto.response.CommentApiResponse;
import it.evodev.instagram.comments.dto.response.CommentDataDTO;
import it.evodev.instagram.comments.dto.response.CommentListDataDTO;
import it.evodev.instagram.comments.service.CommentsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/priv/comments")
@RequiredArgsConstructor
public class CommentsController {

    private static final Logger logger = LoggerFactory.getLogger(CommentsController.class);

    private final CommentsService commentsService;

    /**
     * Usiamo GET su /api/priv/comments perché la lettura della lista commenti è idempotente
     * e dipende dal postId passato come query param, come nel contratto legacy.
     */
    @GetMapping
    public ResponseEntity<CommentApiResponse<CommentListDataDTO>> list(
            @RequestParam Long postId,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/comments - request received, postId: {}, limit: {}, offset: {}",
                postId, limit, offset);

        CommentListDataDTO response = commentsService.listComments(authentication.getName(), postId, limit, offset);

        logger.info("GET /api/priv/comments - completed, postId: {}, comments: {}", postId, response.comments().size());
        return ResponseEntity.ok(CommentApiResponse.success(response, "Comments retrieved successfully"));
    }

    /**
     * Usiamo POST su /api/priv/comments perché la creazione commento modifica stato e contatori.
     */
    @PostMapping
    public ResponseEntity<CommentApiResponse<CommentDataDTO>> create(
            @Valid @RequestBody CommentCreateRequestDTO request,
            Authentication authentication
    ) {
        logger.info("POST /api/priv/comments - request received, postId: {}, parentId: {}",
                request.postId(), request.parentId());

        CommentDataDTO response = commentsService.createComment(authentication.getName(), request);

        logger.info("POST /api/priv/comments - completed, postId: {}, commentId: {}", request.postId(), response.id());
        return ResponseEntity.status(201).body(CommentApiResponse.success(response, "Comment created successfully"));
    }

    /**
     * Usiamo DELETE su /api/priv/comments/{commentId} perché l'operazione rimuove logicamente
     * un commento esistente tramite soft delete.
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<CommentApiResponse<Void>> delete(
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        logger.info("DELETE /api/priv/comments/{} - request received", commentId);

        commentsService.deleteComment(authentication.getName(), commentId);

        logger.info("DELETE /api/priv/comments/{} - completed", commentId);
        return ResponseEntity.ok(CommentApiResponse.<Void>success(null, "Comment deleted successfully"));
    }
}
