package it.evodev.instagram.stories.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "it.evodev.instagram.stories")
public class StoryViewExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(StoryViewExceptionHandler.class);

    @ExceptionHandler(StoryNotFoundOrNotAccessibleException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(StoryNotFoundOrNotAccessibleException e) {
        logger.warn("Story view rejected because resource is not available: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error("STORY_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(StoryViewValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(StoryViewValidationException e) {
        logger.warn("Story view validation failed: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error("STORY_VIEW_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(StoryViewException.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(StoryViewException e) {
        logger.error("Story view module error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("STORY_VIEW_ERROR", "Stories service temporarily unavailable."));
    }

    private static Map<String, Object> error(String code, String message) {
        return Map.of("success", false, "error", code, "message", message);
    }
}
