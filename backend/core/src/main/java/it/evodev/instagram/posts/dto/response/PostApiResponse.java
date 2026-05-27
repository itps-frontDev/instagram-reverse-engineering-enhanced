package it.evodev.instagram.posts.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * DTO generico per le risposte API del modulo posts.
 * Usato per tutti gli endpoint di posts (save-toggle, tags, etc.)
 * 
 * @param <T> Tipo del payload data
 */
@Getter
@AllArgsConstructor
public class PostApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> PostApiResponse<T> success(T data, String message) {
        return new PostApiResponse<>(true, data, null, message);
    }

    public static <T> PostApiResponse<T> error(String error, String message) {
        return new PostApiResponse<>(false, null, error, message);
    }
}
