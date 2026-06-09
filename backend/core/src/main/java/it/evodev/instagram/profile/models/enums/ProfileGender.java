package it.evodev.instagram.profile.models.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Optional;

@Getter
public enum ProfileGender {
    MALE("male"),
    FEMALE("female"),
    PREFER_NOT_TO_SAY("prefer_not_to_say"),
    CUSTOM("custom");

    private final String value;

    ProfileGender(String value) {
        this.value = value;
    }

    public static Optional<ProfileGender> fromValue(String value) {
        return Arrays.stream(values())
                .filter(gender -> gender.value.equals(value))
                .findFirst();
    }
}
