package it.evodev.instagram.media.exceptions;

public class MediaAccessDeniedException extends RuntimeException {
    public MediaAccessDeniedException(String message) {
        super(message);
    }
}
