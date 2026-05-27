package it.evodev.instagram.follow.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponseDTO<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> FollowResponseDTO<T> success(T data, String message) {
        return new FollowResponseDTO<>(true, data, null, message);
    }

    public static <T> FollowResponseDTO<T> error(String error, String message) {
        return new FollowResponseDTO<>(false, null, error, message);
    }
}
