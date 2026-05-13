package it.evodev.instagram.profile.exception;

import it.evodev.instagram.profile.dto.ProfileApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
        logger.error("Unhandled profile exception. Error: {}", exception.getMessage());
        return ResponseEntity.internalServerError()
                .body(ProfileApiResponse.error("PROFILE_INTERNAL_ERROR", "Profile operation failed"));
    }
}
