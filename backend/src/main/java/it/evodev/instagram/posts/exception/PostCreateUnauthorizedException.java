package it.evodev.instagram.posts.exception;

public class PostCreateUnauthorizedException extends RuntimeException {
    public PostCreateUnauthorizedException(String message) {
        super(message);
    }
}
