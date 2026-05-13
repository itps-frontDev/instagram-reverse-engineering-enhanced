package it.evodev.instagram.search.exception;

import it.evodev.instagram.search.dto.SearchApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "it.evodev.instagram.search")
public class SearchExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(SearchExceptionHandler.class);

    @ExceptionHandler(SearchException.class)
    public ResponseEntity<SearchApiResponse<Void>> handleSearchException(SearchException exception) {
        logger.error("Search exception handled. Error: {}", exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(SearchApiResponse.error(exception.getErrorCode(), exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SearchApiResponse<Void>> handleGenericException(Exception exception) {
        logger.error("Unhandled search exception. Error: {}", exception.getMessage());
        return ResponseEntity.internalServerError()
                .body(SearchApiResponse.error("SEARCH_INTERNAL_ERROR", "Search temporarily unavailable"));
    }
}
