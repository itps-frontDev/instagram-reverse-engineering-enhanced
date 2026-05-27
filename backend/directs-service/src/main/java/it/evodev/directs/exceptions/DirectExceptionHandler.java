package it.evodev.directs.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "it.evodev.directs")
public class DirectExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(DirectExceptionHandler.class);

    @ExceptionHandler(DirectNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(DirectNotFoundException e) {
        logger.warn("Direct not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("DIRECT_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(DirectForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(DirectForbiddenException e) {
        logger.warn("Direct forbidden: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("DIRECT_FORBIDDEN", e.getMessage()));
    }

    @ExceptionHandler(DirectValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(DirectValidationException e) {
        logger.warn("Direct validation error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("DIRECT_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(DirectException.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(DirectException e) {
        logger.error("Direct service error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("DIRECT_ERROR", "Direct messages service unavailable"));
    }

    private static Map<String, Object> error(String code, String message) {
        return Map.of("success", false, "error", code, "message", message);
    }
}
