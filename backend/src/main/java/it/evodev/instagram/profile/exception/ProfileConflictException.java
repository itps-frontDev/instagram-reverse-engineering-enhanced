package it.evodev.instagram.profile.exception;

import org.springframework.http.HttpStatus;

public class ProfileConflictException extends ProfileException {
    public ProfileConflictException(String message) {
        super("PROFILE_CONFLICT", message, HttpStatus.CONFLICT);
    }
}
