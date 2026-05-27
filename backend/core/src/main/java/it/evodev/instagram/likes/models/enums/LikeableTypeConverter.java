package it.evodev.instagram.likes.models.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LikeableTypeConverter implements AttributeConverter<LikeableType, String> {

    @Override
    public String convertToDatabaseColumn(LikeableType attribute) {
        if (attribute == null) return null;
        return attribute.name().toLowerCase();
    }

    @Override
    public LikeableType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return LikeableType.valueOf(dbData.toUpperCase());
    }
}
