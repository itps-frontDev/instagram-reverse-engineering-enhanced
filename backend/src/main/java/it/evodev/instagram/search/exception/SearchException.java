package it.evodev.instagram.search.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class SearchException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public SearchException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
