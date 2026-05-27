package it.evodev.instagram.notifications.util;

import it.evodev.instagram.notifications.exceptions.NotificationValidationException;
import it.evodev.instagram.notifications.models.enums.NotificationReferenceType;
import it.evodev.instagram.notifications.models.enums.NotificationType;

import java.util.Locale;

public final class NotificationTypeMapper {

    private NotificationTypeMapper() {
    }

    public static NotificationType toNotificationType(String rawType) {
        if (rawType == null || rawType.isBlank()) {
            throw new NotificationValidationException("Notification type is required");
        }

        try {
            return NotificationType.valueOf(normalize(rawType));
        } catch (IllegalArgumentException e) {
            throw new NotificationValidationException("Unsupported notification type: " + rawType);
        }
    }

    public static NotificationReferenceType toReferenceType(String rawReferenceType) {
        if (rawReferenceType == null || rawReferenceType.isBlank()) {
            return null;
        }

        try {
            return NotificationReferenceType.valueOf(normalize(rawReferenceType));
        } catch (IllegalArgumentException e) {
            throw new NotificationValidationException("Unsupported notification reference type: " + rawReferenceType);
        }
    }

    public static String toExternalType(NotificationType type) {
        return type.name().toLowerCase(Locale.ROOT);
    }

    public static String toExternalReferenceType(NotificationReferenceType referenceType) {
        if (referenceType == null) {
            return null;
        }
        return referenceType.name().toLowerCase(Locale.ROOT);
    }

    private static String normalize(String value) {
        return value.trim().replace("-", "_").toUpperCase(Locale.ROOT);
    }
}
