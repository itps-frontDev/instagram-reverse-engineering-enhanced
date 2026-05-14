package it.evodev.instagram.profile.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProfileApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> ProfileApiResponse<T> success(T data, String message) {
        return new ProfileApiResponse<>(true, data, null, message);
    }

    public static <T> ProfileApiResponse<T> error(String error, String message) {
        return new ProfileApiResponse<>(false, null, error, message);
    }
}
