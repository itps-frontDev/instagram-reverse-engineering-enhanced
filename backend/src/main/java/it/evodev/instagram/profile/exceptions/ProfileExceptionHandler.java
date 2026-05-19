package it.evodev.instagram.profile.exceptions;

import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice(basePackages = "it.evodev.instagram.profile")
public class ProfileExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ProfileExceptionHandler.class);

    @ExceptionHandler(ProfileException.class)
    public ResponseEntity<ProfileApiResponse<Void>> handleProfileException(ProfileException exception) {
        logger.error("Profile exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(ProfileApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProfileApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled profile exception. Error: {}", exception.getMessage(), exception);
        return ResponseEntity.internalServerError()
                .body(ProfileApiResponse.error("PROFILE_INTERNAL_ERROR", "Profile operation failed"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProfileApiResponse<Void>> handleValidationException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Invalid request payload");
        logger.error("Profile validation exception handled. Error: {}", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ProfileApiResponse.error("PROFILE_BAD_REQUEST", message));
    }
}
