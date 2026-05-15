package it.evodev.instagram.search.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SearchApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> SearchApiResponse<T> success(T data, String message) {
        return new SearchApiResponse<>(true, data, null, message);
    }

    public static <T> SearchApiResponse<T> error(String error, String message) {
        return new SearchApiResponse<>(false, null, error, message);
    }
}
