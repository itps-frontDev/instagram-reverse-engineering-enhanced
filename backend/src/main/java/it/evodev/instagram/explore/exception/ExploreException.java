package it.evodev.instagram.explore.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ExploreException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public ExploreException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}

