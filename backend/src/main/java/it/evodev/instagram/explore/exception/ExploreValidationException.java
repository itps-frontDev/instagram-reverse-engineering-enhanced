package it.evodev.instagram.explore.exception;

import org.springframework.http.HttpStatus;

public class ExploreValidationException extends ExploreException {
    public ExploreValidationException(String message) {
        super("EXPLORE_VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}

