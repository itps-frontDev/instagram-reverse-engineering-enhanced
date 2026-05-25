package it.evodev.instagram.stories.exception.read;

public class StoryNotFoundOrNotAccessibleException extends StoryReadException {
    public StoryNotFoundOrNotAccessibleException(String message) {
        super(message);
    }
}
