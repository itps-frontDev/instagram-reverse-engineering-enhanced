package it.evodev.instagram.stories.exception.read;

import it.evodev.instagram.stories.dto.response.StoryApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(basePackages = "it.evodev.instagram.stories.controller.read")
public class StoryReadExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(StoryReadExceptionHandler.class);

    @ExceptionHandler(StoryNotFoundOrNotAccessibleException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleNotFound(StoryNotFoundOrNotAccessibleException exception) {
        logger.warn("Story read rejected because resource is not available: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(StoryApiResponse.error("STORY_NOT_FOUND", exception.getMessage()));
    }

    @ExceptionHandler(StoryReadValidationException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleValidation(StoryReadValidationException exception) {
        logger.warn("Story read validation failed: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(StoryApiResponse.error("STORY_READ_VALIDATION_ERROR", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        logger.warn("Story read path param type mismatch: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(StoryApiResponse.error("STORY_READ_VALIDATION_ERROR", "Invalid story profile id."));
    }

    @ExceptionHandler(StoryReadException.class)
    public ResponseEntity<StoryApiResponse<Void>> handleGeneric(StoryReadException exception) {
        logger.error("Story read module error: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(StoryApiResponse.error("STORY_READ_ERROR", "Stories service temporarily unavailable."));
    }
}
