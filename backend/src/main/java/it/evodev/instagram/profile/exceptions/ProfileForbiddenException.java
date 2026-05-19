package it.evodev.instagram.profile.exceptions;

import org.springframework.http.HttpStatus;

public class ProfileForbiddenException extends ProfileException {
    public ProfileForbiddenException(String message) {
        super("PROFILE_FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }
}
