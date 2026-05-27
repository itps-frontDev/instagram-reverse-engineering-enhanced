package it.evodev.instagram.explore.exception;

import org.springframework.http.HttpStatus;

public class ExploreUnauthorizedException extends ExploreException {
    public ExploreUnauthorizedException(String message) {
        super("EXPLORE_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}

