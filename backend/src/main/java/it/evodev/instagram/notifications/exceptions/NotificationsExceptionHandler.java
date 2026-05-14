package it.evodev.instagram.notifications.exceptions;

import it.evodev.instagram.notifications.dto.responses.NotificationActionResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice(basePackages = "it.evodev.instagram.notifications")
public class NotificationsExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(NotificationsExceptionHandler.class);

    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleNotFound(NotificationNotFoundException e) {
        logger.error("Notification exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOTIFICATION_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(NotificationAccessDeniedException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleAccessDenied(NotificationAccessDeniedException e) {
        logger.error("Notification exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("NOTIFICATION_ACCESS_DENIED", e.getMessage()));
    }

    @ExceptionHandler(NotificationValidationException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleValidation(NotificationValidationException e) {
        logger.error("Notification exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("NOTIFICATION_VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(NotificationStrategyNotFoundException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleStrategyNotFound(NotificationStrategyNotFoundException e) {
        logger.error("Notification exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("NOTIFICATION_STRATEGY_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleArgumentValidation(MethodArgumentNotValidException e) {
        logger.error("Notification validation error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("NOTIFICATION_VALIDATION_ERROR", "Invalid request payload"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleDataIntegrity(DataIntegrityViolationException e) {
        logger.error("Notification data integrity error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error("NOTIFICATION_DATA_INTEGRITY_ERROR", "Notification persistence conflict"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<NotificationActionResponseDTO<Object>> handleUnexpected(Exception e) {
        logger.error("Notification unexpected error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("NOTIFICATION_INTERNAL_ERROR", "Notification service unavailable"));
    }

    private static NotificationActionResponseDTO<Object> error(String code, String message) {
        NotificationErrorDTO payload = new NotificationErrorDTO(code, message, LocalDateTime.now());
        return new NotificationActionResponseDTO<>(false, null, payload.getCode(), payload.getMessage());
    }
}
