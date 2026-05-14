package it.evodev.instagram.notifications.util;

import it.evodev.instagram.notifications.exceptions.NotificationValidationException;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

public final class NotificationCursorUtil {

    private NotificationCursorUtil() {
    }

    public static LocalDateTime parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        try {
            return LocalDateTime.parse(cursor.trim());
        } catch (DateTimeParseException e) {
            throw new NotificationValidationException("Invalid cursor format");
        }
    }

    public static String formatCursor(LocalDateTime value) {
        return value == null ? null : value.toString();
    }
}
