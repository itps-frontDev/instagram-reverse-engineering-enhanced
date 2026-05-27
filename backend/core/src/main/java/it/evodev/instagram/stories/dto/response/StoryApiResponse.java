package it.evodev.instagram.stories.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StoryApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> StoryApiResponse<T> success(T data, String message) {
        return new StoryApiResponse<>(true, data, null, message);
    }

    public static <T> StoryApiResponse<T> error(String error, String message) {
        return new StoryApiResponse<>(false, null, error, message);
    }
}
