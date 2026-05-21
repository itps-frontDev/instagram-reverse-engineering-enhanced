package it.evodev.instagram.feed.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FeedApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> FeedApiResponse<T> success(T data, String message) {
        return new FeedApiResponse<>(true, data, null, message);
    }

    public static <T> FeedApiResponse<T> error(String error, String message) {
        return new FeedApiResponse<>(false, null, error, message);
    }
}
