package it.evodev.instagram.explore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ExploreApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> ExploreApiResponse<T> success(T data, String message) {
        return new ExploreApiResponse<>(true, data, null, message);
    }

    public static <T> ExploreApiResponse<T> error(String error, String message) {
        return new ExploreApiResponse<>(false, null, error, message);
    }
}

