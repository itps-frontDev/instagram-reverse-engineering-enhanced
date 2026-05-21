package it.evodev.instagram.feed.exception;

import it.evodev.instagram.feed.dto.response.FeedApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "it.evodev.instagram.feed")
public class FeedExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(FeedExceptionHandler.class);

    @ExceptionHandler(FeedException.class)
    public ResponseEntity<FeedApiResponse<Void>> handleFeedException(FeedException exception) {
        logger.error("Feed exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(FeedApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<FeedApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled feed exception. Error: {}", exception.getMessage());
        return ResponseEntity.internalServerError()
                .body(FeedApiResponse.error("FEED_INTERNAL_ERROR", "Feed temporarily unavailable"));
    }
}
