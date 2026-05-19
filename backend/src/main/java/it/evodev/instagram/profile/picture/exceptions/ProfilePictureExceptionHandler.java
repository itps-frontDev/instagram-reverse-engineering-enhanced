package it.evodev.instagram.profile.picture.exceptions;

import it.evodev.instagram.profile.picture.dto.ProfilePictureErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@Order(1)
@RestControllerAdvice(basePackages = "it.evodev.instagram.profile.picture")
public class ProfilePictureExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ProfilePictureExceptionHandler.class);

    @ExceptionHandler(ProfilePictureException.class)
    public ResponseEntity<ProfilePictureErrorDTO> handleValidation(ProfilePictureException e) {
        logger.warn("Profile picture validation failed [{}]: {}", e.getErrorCode(), e.getMessage());
        HttpStatus status = switch (e.getErrorCode()) {
            case "NO_IMAGE", "PROFILE_NOT_FOUND" -> HttpStatus.NOT_FOUND;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status)
                .body(new ProfilePictureErrorDTO(e.getErrorCode(), e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ProfilePictureErrorDTO> handleMaxSize(MaxUploadSizeExceededException e) {
        logger.warn("Upload exceeded multipart max size: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ProfilePictureErrorDTO("FILE_TOO_LARGE", "File exceeds maximum allowed size.", LocalDateTime.now()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProfilePictureErrorDTO> handleGeneric(Exception e) {
        logger.error("Unhandled exception in profile picture [{}]: {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ProfilePictureErrorDTO("INTERNAL_ERROR", "An unexpected error occurred.", LocalDateTime.now()));
    }
}
