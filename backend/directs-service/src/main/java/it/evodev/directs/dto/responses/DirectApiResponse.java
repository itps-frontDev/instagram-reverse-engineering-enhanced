package it.evodev.directs.dto.responses;

public record DirectApiResponse<T>(
        boolean success,
        T data,
        String error,
        String message
) {
    public static <T> DirectApiResponse<T> success(T data) {
        return new DirectApiResponse<>(true, data, null, null);
    }

    public static <T> DirectApiResponse<T> error(String error, String message) {
        return new DirectApiResponse<>(false, null, error, message);
    }
}
