package it.evodev.instagram.auth.exceptions;

public class InvalidTokenException extends AuthException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
