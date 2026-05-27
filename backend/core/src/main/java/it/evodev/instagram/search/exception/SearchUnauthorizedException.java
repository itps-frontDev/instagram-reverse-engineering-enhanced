package it.evodev.instagram.search.exception;

import org.springframework.http.HttpStatus;

public class SearchUnauthorizedException extends SearchException {
    public SearchUnauthorizedException(String message) {
        super("SEARCH_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}
