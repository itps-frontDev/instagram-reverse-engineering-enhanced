package it.evodev.instagram.profile.exception;

import org.springframework.http.HttpStatus;

public class ProfileUnauthorizedException extends ProfileException {
    public ProfileUnauthorizedException(String message) {
        super("PROFILE_UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
    }
}
