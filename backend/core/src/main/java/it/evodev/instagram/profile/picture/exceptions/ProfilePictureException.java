package it.evodev.instagram.profile.picture.exceptions;

import lombok.Getter;

@Getter
public class ProfilePictureException extends RuntimeException {

    private final String errorCode;

    public ProfilePictureException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

}
