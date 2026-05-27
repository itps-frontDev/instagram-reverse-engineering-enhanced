package it.evodev.instagram.search.exception;

import org.springframework.http.HttpStatus;

public class SearchValidationException extends SearchException {
    public SearchValidationException(String message) {
        super("SEARCH_VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}
