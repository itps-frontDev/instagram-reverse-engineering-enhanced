package it.evodev.instagram.comments.exception;

import org.springframework.http.HttpStatus;

public class CommentValidationException extends CommentException {
    public CommentValidationException(String message) {
        super("COMMENT_VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}
