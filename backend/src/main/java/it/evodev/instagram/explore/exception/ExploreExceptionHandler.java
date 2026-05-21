package it.evodev.instagram.explore.exception;

import it.evodev.instagram.explore.dto.response.ExploreApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "it.evodev.instagram.explore")
public class ExploreExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ExploreExceptionHandler.class);

    @ExceptionHandler(ExploreException.class)
    public ResponseEntity<ExploreApiResponse<Void>> handleExploreException(ExploreException exception) {
        logger.error("Explore exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(ExploreApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExploreApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled explore exception. Error: {}", exception.getMessage());
        return ResponseEntity.internalServerError()
                .body(ExploreApiResponse.error("EXPLORE_INTERNAL_ERROR", "Explore temporarily unavailable"));
    }
}

