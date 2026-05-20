package it.evodev.instagram.posts.exception;

import it.evodev.instagram.posts.dto.response.PostApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler per il modulo posts.
 * Gestisce eccezioni specifiche del modulo e ritorna risposte strutturate.
 */
@RestControllerAdvice(basePackages = "it.evodev.instagram.posts")
public class PostsExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(PostsExceptionHandler.class);

    @ExceptionHandler(PostSaveException.class)
    public ResponseEntity<PostApiResponse<Void>> handlePostSaveException(PostSaveException exception) {
        logger.error("Posts save exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(PostApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<PostApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled posts exception. Error: {}", exception.getMessage(), exception);
        return ResponseEntity.internalServerError()
                .body(PostApiResponse.error("POST_INTERNAL_ERROR", "Post operation failed"));
    }
}
