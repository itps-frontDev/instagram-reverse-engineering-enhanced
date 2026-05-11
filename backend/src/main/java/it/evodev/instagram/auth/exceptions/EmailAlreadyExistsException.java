package it.evodev.instagram.auth.exceptions;

public class EmailAlreadyExistsException extends AuthException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
