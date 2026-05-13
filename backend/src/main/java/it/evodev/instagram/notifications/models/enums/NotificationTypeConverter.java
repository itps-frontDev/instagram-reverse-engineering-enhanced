package it.evodev.instagram.notifications.models.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        if (attribute == null) return null;
        return attribute.name().toLowerCase(Locale.ROOT);
    }

    @Override
    public NotificationType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return NotificationType.valueOf(dbData.toUpperCase(Locale.ROOT));
    }
}
