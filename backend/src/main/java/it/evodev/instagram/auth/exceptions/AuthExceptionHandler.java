package it.evodev.instagram.auth.exceptions;

import com.fatellicaterinasrl.fatellisync.auth.dto.AuthErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice(basePackages = "com.fatellicaterinasrl.fatellisync.auth")
public class AuthExceptionHandler {

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<AuthErrorDTO> handleLocked(AccountLockedException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new AuthErrorDTO("ACCOUNT_LOCKED", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<AuthErrorDTO> handleInvalidToken(InvalidTokenException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthErrorDTO("INVALID_TOKEN", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<AuthErrorDTO> handleAuthException(AuthException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthErrorDTO("AUTH_ERROR", e.getMessage(), LocalDateTime.now()));
    }
}
