package it.evodev.instagram.notifications.util;

import it.evodev.instagram.notifications.exceptions.NotificationValidationException;

import java.time.Instant;
import java.time.format.DateTimeParseException;

public final class NotificationCursorUtil {

    private NotificationCursorUtil() {
    }

    public static Instant parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(cursor.trim());
        } catch (DateTimeParseException e) {
            throw new NotificationValidationException("Invalid cursor format");
        }
    }

    public static String formatCursor(Instant value) {
        return value == null ? null : value.toString();
    }
}
