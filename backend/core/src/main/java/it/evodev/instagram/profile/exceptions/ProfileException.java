package it.evodev.instagram.profile.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ProfileException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public ProfileException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }
}
