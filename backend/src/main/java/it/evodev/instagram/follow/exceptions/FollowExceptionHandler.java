package it.evodev.instagram.follow.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "it.evodev.instagram.follow")
public class FollowExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(FollowExceptionHandler.class);

    @ExceptionHandler(FollowNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(FollowNotFoundException e) {
        logger.warn("Follow not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("FOLLOW_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(FollowValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(FollowValidationException e) {
        logger.warn("Follow validation error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("FOLLOW_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(FollowForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(FollowForbiddenException e) {
        logger.warn("Follow forbidden: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("FOLLOW_FORBIDDEN", e.getMessage()));
    }

    @ExceptionHandler(FollowException.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(FollowException e) {
        logger.error("Follow service error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("FOLLOW_ERROR", "Follow service unavailable"));
    }

    private static Map<String, Object> error(String code, String message) {
        return Map.of("success", false, "error", code, "message", message);
    }
}
