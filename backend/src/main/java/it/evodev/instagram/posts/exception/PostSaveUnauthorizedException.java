package it.evodev.instagram.posts.exception;

import org.springframework.http.HttpStatus;

public class PostSaveUnauthorizedException extends PostSaveException {
    public PostSaveUnauthorizedException(String message) {
        super("POST_SAVE_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}
