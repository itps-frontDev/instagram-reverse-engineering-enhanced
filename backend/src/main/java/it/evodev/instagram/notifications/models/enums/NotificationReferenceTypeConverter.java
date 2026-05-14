package it.evodev.instagram.notifications.models.enums;

import it.evodev.instagram.notifications.util.NotificationTypeMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Locale;

@Converter(autoApply = true)
public class NotificationReferenceTypeConverter implements AttributeConverter<NotificationReferenceType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationReferenceType attribute) {
        return NotificationTypeMapper.toExternalReferenceType(attribute);
    }

    @Override
    public NotificationReferenceType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return NotificationReferenceType.valueOf(dbData.toUpperCase(Locale.ROOT));
    }
}
