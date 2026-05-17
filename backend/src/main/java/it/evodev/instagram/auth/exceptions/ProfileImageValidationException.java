package it.evodev.instagram.auth.exceptions;

public class ProfileImageValidationException extends RuntimeException {

    private final String errorCode;

    public ProfileImageValidationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
