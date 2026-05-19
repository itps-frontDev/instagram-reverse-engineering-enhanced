package it.evodev.instagram.posts.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class PostSaveException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public PostSaveException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
