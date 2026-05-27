package it.evodev.instagram.reels.dto.responses;

public record ReelApiResponse<T>(
        boolean success,
        T data,
        String error,
        String message
) {
    public static <T> ReelApiResponse<T> success(T data) {
        return new ReelApiResponse<>(true, data, null, null);
    }

    public static <T> ReelApiResponse<T> error(String error, String message) {
        return new ReelApiResponse<>(false, null, error, message);
    }
}
