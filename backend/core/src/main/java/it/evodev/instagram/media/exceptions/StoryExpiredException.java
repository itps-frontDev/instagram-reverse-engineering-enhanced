package it.evodev.instagram.media.exceptions;

public class StoryExpiredException extends RuntimeException {
    public StoryExpiredException(String message) {
        super(message);
    }
}
