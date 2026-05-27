package it.evodev.instagram.likes.models.enums;

import it.evodev.instagram.likes.exceptions.LikeValidationException;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class LikeableTypeWebConverter implements Converter<String, LikeableType> {

    @Override
    public LikeableType convert(String source) {
        try {
            return LikeableType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new LikeValidationException("Invalid likeable type: " + source);
        }
    }
}
