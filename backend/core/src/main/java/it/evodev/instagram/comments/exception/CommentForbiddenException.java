package it.evodev.instagram.comments.exception;

import org.springframework.http.HttpStatus;

public class CommentForbiddenException extends CommentException {
    public CommentForbiddenException(String message) {
        super("COMMENT_FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }
}
