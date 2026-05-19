package it.evodev.instagram.posts.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PostSaveApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> PostSaveApiResponse<T> success(T data, String message) {
        return new PostSaveApiResponse<>(true, data, null, message);
    }

    public static <T> PostSaveApiResponse<T> error(String error, String message) {
        return new PostSaveApiResponse<>(false, null, error, message);
    }
}
