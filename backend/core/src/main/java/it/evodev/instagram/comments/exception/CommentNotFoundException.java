package it.evodev.instagram.comments.exception;

import org.springframework.http.HttpStatus;

public class CommentNotFoundException extends CommentException {
    public CommentNotFoundException(String message) {
        super("COMMENT_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
