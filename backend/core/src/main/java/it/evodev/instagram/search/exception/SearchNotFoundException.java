package it.evodev.instagram.search.exception;

import org.springframework.http.HttpStatus;

public class SearchNotFoundException extends SearchException {
    public SearchNotFoundException(String message) {
        super("SEARCH_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
