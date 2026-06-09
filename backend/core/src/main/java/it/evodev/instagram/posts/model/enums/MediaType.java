package it.evodev.instagram.posts.model.enums;

import lombok.Getter;

@Getter
public enum MediaType {
    IMAGE("image"),
    VIDEO("video");

    private final String value;

    MediaType(String value) {
        this.value = value;
    }

    public static MediaType fromString(String value) {
        for (MediaType type : values()) {
            if (type.value.equalsIgnoreCase(value)) return type;
        }
        return IMAGE;
    }

    public PostType toPostType() {
        return this == VIDEO ? PostType.REEL : PostType.POST;
    }
}
