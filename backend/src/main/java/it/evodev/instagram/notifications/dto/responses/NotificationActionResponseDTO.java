package it.evodev.instagram.notifications.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationActionResponseDTO<T> {
    private boolean success;
    private T data;
    private String error;
    private String message;

    public static <T> NotificationActionResponseDTO<T> success(T data) {
        return new NotificationActionResponseDTO<>(true, data, null, null);
    }

    public static <T> NotificationActionResponseDTO<T> success(T data, String message) {
        return new NotificationActionResponseDTO<>(true, data, null, message);
    }
}
