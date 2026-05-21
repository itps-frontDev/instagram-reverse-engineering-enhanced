package it.evodev.instagram.comments.exception;

import org.springframework.http.HttpStatus;

public class CommentUnauthorizedException extends CommentException {
    public CommentUnauthorizedException(String message) {
        super("COMMENT_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}
