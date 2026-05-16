package it.evodev.instagram.likes.exceptions;

import it.evodev.instagram.likes.dto.responses.LikeToggleResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice(basePackages = "it.evodev.instagram.likes")
public class LikesExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(LikesExceptionHandler.class);

    @ExceptionHandler(LikeableNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(LikeableNotFoundException e) {
        logger.warn("Like exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("LIKEABLE_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(LikeValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(LikeValidationException e) {
        logger.warn("Like validation exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("LIKE_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        logger.warn("Like path param type mismatch: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(error("LIKE_VALIDATION_ERROR", "Invalid likeable type: " + e.getValue()));
    }

    @ExceptionHandler(LikeException.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(LikeException e) {
        logger.error("Like service error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("LIKE_ERROR", "Likes service unavailable"));
    }

    private static Map<String, Object> error(String code, String message) {
        return Map.of("success", false, "error", code, "message", message);
    }
}
