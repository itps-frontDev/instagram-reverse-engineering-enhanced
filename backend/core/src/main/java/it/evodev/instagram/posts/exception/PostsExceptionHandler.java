package it.evodev.instagram.posts.exception;

import it.evodev.instagram.posts.dto.response.PostApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
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

    @ExceptionHandler(PostCreateValidationException.class)
    public ResponseEntity<PostApiResponse<Void>> handlePostCreateValidation(PostCreateValidationException exception) {
        logger.warn("Post create validation error: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(PostApiResponse.error("POST_CREATE_VALIDATION_ERROR", exception.getMessage()));
    }

    @ExceptionHandler(PostCreateUnauthorizedException.class)
    public ResponseEntity<PostApiResponse<Void>> handlePostCreateUnauthorized(PostCreateUnauthorizedException exception) {
        logger.warn("Post create unauthorized: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(PostApiResponse.error("POST_CREATE_UNAUTHORIZED", exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<PostApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled posts exception. Error: {}", exception.getMessage(), exception);
        return ResponseEntity.internalServerError()
                .body(PostApiResponse.error("POST_INTERNAL_ERROR", "Post operation failed"));
    }
}
