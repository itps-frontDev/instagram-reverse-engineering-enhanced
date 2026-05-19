package it.evodev.instagram.profile.exception;

import org.springframework.http.HttpStatus;

/**
 * Eccezione lanciata quando l'utente non ha l'età minima (13 anni).
 * Estende ProfileException per essere gestita dal ProfileExceptionHandler globale.
 */
public class InvalidAgeException extends ProfileException {
    public InvalidAgeException(String message) {
        super("PROFILE_INVALID_AGE", message, HttpStatus.BAD_REQUEST);
    }
}
