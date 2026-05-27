package it.evodev.instagram.stories.exception;

import it.evodev.instagram.stories.dto.response.StoryApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(basePackages = "it.evodev.instagram.stories")
public class StoryExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(StoryExceptionHandler.class);

    @ExceptionHandler(StoryNotFoundException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleNotFound(StoryNotFoundException e) {
        logger.warn("Story not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(StoryApiResponse.error("STORY_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(StoryValidationException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleValidation(StoryValidationException e) {
        logger.warn("Story validation failed: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(StoryApiResponse.error("STORY_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        logger.warn("Story request parameter type mismatch: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(StoryApiResponse.error("STORY_INVALID_PARAMETER", "Invalid parameter: " + e.getName()));
    }

    @ExceptionHandler(StoryException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleGeneric(StoryException e) {
        logger.error("Story module error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(StoryApiResponse.error("STORY_ERROR", "Stories service temporarily unavailable."));
    }
}
