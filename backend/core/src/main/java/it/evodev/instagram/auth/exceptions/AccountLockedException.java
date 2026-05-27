package it.evodev.instagram.auth.exceptions;

public class AccountLockedException extends AuthException {
    public AccountLockedException(String message) {
        super(message);
    }
}
