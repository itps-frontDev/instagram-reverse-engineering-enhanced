package it.evodev.instagram.feed.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class FeedException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public FeedException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
