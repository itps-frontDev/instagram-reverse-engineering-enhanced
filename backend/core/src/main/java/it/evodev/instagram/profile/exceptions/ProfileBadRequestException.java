package it.evodev.instagram.profile.exceptions;

import org.springframework.http.HttpStatus;

public class ProfileBadRequestException extends ProfileException {
    public ProfileBadRequestException(String message) {
        super("PROFILE_BAD_REQUEST", message, HttpStatus.BAD_REQUEST);
    }
}
