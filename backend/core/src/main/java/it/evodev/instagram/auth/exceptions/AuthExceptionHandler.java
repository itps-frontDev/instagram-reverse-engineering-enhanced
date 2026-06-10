package it.evodev.instagram.auth.exceptions;

import it.evodev.instagram.auth.dto.AuthErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice(basePackages = "it.evodev.instagram.auth")
public class AuthExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(AuthExceptionHandler.class);

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<AuthErrorDTO> handleLocked(AccountLockedException e) {
        logger.error("Auth exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new AuthErrorDTO("ACCOUNT_LOCKED", e.getMessage(), Instant.now()));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<AuthErrorDTO> handleInvalidToken(InvalidTokenException e) {
        logger.error("Auth exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthErrorDTO("INVALID_TOKEN", e.getMessage(), Instant.now()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<AuthErrorDTO> handleDuplicateEmail(EmailAlreadyExistsException e) {
        logger.error("Auth exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new AuthErrorDTO("EMAIL_ALREADY_EXISTS", e.getMessage(), Instant.now()));
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<AuthErrorDTO> handleDuplicateUsername(UsernameAlreadyExistsException e) {
        logger.error("Auth exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new AuthErrorDTO("USERNAME_ALREADY_EXISTS", e.getMessage(), Instant.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthErrorDTO> handleValidation(MethodArgumentNotValidException e) {
        logger.error("Auth validation error: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new AuthErrorDTO("VALIDATION_ERROR", "Invalid request payload", Instant.now()));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<AuthErrorDTO> handleAuthException(AuthException e) {
        logger.error("Auth exception handled: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthErrorDTO("AUTH_ERROR", e.getMessage(), Instant.now()));
    }
}
