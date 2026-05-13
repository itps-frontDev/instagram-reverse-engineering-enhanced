package it.evodev.instagram.profile.exception;

import org.springframework.http.HttpStatus;

public class ProfileNotFoundException extends ProfileException {
    public ProfileNotFoundException(String message) {
        super("PROFILE_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
