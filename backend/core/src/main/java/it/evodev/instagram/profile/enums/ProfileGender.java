package it.evodev.instagram.profile.enums;

import java.util.Arrays;
import java.util.Optional;

public enum ProfileGender {
    MALE("male"),
    FEMALE("female"),
    PREFER_NOT_TO_SAY("prefer_not_to_say"),
    CUSTOM("custom");

    private final String value;

    ProfileGender(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Optional<ProfileGender> fromValue(String value) {
        return Arrays.stream(values())
                .filter(gender -> gender.value.equals(value))
                .findFirst();
    }
}
