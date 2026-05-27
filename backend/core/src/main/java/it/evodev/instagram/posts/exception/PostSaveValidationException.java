package it.evodev.instagram.posts.exception;

import org.springframework.http.HttpStatus;

public class PostSaveValidationException extends PostSaveException {
    public PostSaveValidationException(String message) {
        super("POST_SAVE_VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}
