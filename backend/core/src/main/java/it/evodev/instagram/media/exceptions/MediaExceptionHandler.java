package it.evodev.instagram.media.exceptions;

import it.evodev.instagram.media.dto.MediaErrorDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice(basePackages = "it.evodev.instagram.media")
public class MediaExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(MediaExceptionHandler.class);

    @ExceptionHandler(InvalidMediaCategoryException.class)
    public ResponseEntity<MediaErrorDTO> handleInvalidCategory(InvalidMediaCategoryException e) {
        logger.warn("Invalid media category: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MediaErrorDTO("INVALID_CATEGORY", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MediaNotFoundException.class)
    public ResponseEntity<MediaErrorDTO> handleNotFound(MediaNotFoundException e) {
        logger.warn("Media not found: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new MediaErrorDTO("MEDIA_NOT_FOUND", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MediaUnauthenticatedException.class)
    public ResponseEntity<MediaErrorDTO> handleUnauthenticated(MediaUnauthenticatedException e) {
        logger.warn("Media access unauthenticated: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MediaErrorDTO("AUTH_REQUIRED", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(MediaAccessDeniedException.class)
    public ResponseEntity<MediaErrorDTO> handleAccessDenied(MediaAccessDeniedException e) {
        logger.warn("Media access denied: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new MediaErrorDTO("ACCESS_DENIED", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(StoryExpiredException.class)
    public ResponseEntity<MediaErrorDTO> handleStoryExpired(StoryExpiredException e) {
        logger.warn("Story expired: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new MediaErrorDTO("STORY_EXPIRED", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(InvalidMediaPathException.class)
    public ResponseEntity<MediaErrorDTO> handleInvalidPath(InvalidMediaPathException e) {
        logger.warn("Invalid media path: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MediaErrorDTO("INVALID_PATH", e.getMessage(), LocalDateTime.now()));
    }

    @ExceptionHandler(BlobStorageException.class)
    public ResponseEntity<MediaErrorDTO> handleBlobStorage(BlobStorageException e) {
        logger.error("Blob storage error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MediaErrorDTO("STORAGE_ERROR", "Media service temporarily unavailable.", LocalDateTime.now()));
    }
}
