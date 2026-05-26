package it.evodev.instagram.media.strategies;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.media.enums.MediaCategory;

public interface MediaAccessStrategy {
    MediaCategory supportedCategory();

    /**
     * Throws:
     * MediaNotFoundException          — entity does not exist (404)
     * MediaUnauthenticatedException   — auth required, currentProfile is null (401)
     * MediaAccessDeniedException      — authenticated but not authorized (403)
     * StoryExpiredException           — story exists but is expired (410)
     */
    void assertCanAccess(String entityId, Profile currentProfile);
}
