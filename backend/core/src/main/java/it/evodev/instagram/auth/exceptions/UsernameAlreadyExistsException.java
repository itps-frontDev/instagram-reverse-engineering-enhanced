package it.evodev.instagram.auth.exceptions;

public class UsernameAlreadyExistsException extends AuthException {
    public UsernameAlreadyExistsException(String message) {
        super(message);
    }
}
