package it.evodev.instagram.media.enums;

import it.evodev.instagram.media.exceptions.InvalidMediaCategoryException;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum MediaCategory {
    PROFILES("profiles"),
    POSTS("posts"),
    STORIES("stories"),
    MESSAGES("messages");

    private final String path;

    MediaCategory(String path) {
        this.path = path;
    }

    public static MediaCategory fromPath(String path) {
        return Arrays.stream(values())
                .filter(c -> c.path.equals(path))
                .findFirst()
                .orElseThrow(() -> new InvalidMediaCategoryException("Unknown media category: " + path));
    }
}
