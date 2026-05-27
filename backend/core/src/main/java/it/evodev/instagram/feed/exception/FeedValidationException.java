package it.evodev.instagram.feed.exception;

import org.springframework.http.HttpStatus;

public class FeedValidationException extends FeedException {
    public FeedValidationException(String message) {
        super("FEED_VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}
