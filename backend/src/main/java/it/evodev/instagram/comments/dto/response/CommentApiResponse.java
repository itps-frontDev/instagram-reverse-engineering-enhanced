package it.evodev.instagram.comments.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CommentApiResponse<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> CommentApiResponse<T> success(T data, String message) {
        return new CommentApiResponse<>(true, data, null, message);
    }

    public static <T> CommentApiResponse<T> error(String error, String message) {
        return new CommentApiResponse<>(false, null, error, message);
    }
}
