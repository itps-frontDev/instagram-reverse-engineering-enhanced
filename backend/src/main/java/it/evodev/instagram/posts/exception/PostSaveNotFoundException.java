package it.evodev.instagram.posts.exception;

import org.springframework.http.HttpStatus;

public class PostSaveNotFoundException extends PostSaveException {
    public PostSaveNotFoundException(String message) {
        super("POST_SAVE_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
