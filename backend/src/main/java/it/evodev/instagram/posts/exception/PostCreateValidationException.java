package it.evodev.instagram.posts.exception;

public class PostCreateValidationException extends RuntimeException {
    public PostCreateValidationException(String message) {
        super(message);
    }
}
