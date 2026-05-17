package it.evodev.instagram.auth.exceptions;

import it.evodev.instagram.auth.dto.AuthErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice(basePackages = "it.evodev.instagram.auth")
public class ProfileImageExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ProfileImageExceptionHandler.class);

    @ExceptionHandler(ProfileImageValidationException.class)
    public ResponseEntity<AuthErrorDTO> handleValidation(ProfileImageValidationException e) {
        logger.warn("Profile image validation failed [{}]: {}", e.getErrorCode(), e.getMessage());
        HttpStatus status = "NO_IMAGE".equals(e.getErrorCode()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status)
                .body(new AuthErrorDTO(e.getErrorCode(), e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<AuthErrorDTO> handleMaxSize(MaxUploadSizeExceededException e) {
        logger.warn("Upload exceeded max size: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new AuthErrorDTO("FILE_TOO_LARGE", "File exceeds maximum allowed size.", LocalDateTime.now()));
    }
}
