package it.evodev.instagram.feed.exception;

import org.springframework.http.HttpStatus;

public class FeedUnauthorizedException extends FeedException {
    public FeedUnauthorizedException(String message) {
        super("FEED_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}
