package it.evodev.instagram.media.strategies;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.MediaAccessDeniedException;
import it.evodev.instagram.media.exceptions.MediaUnauthenticatedException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MessageMediaAccessStrategy implements MediaAccessStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public MediaCategory supportedCategory() {
        return MediaCategory.MESSAGES;
    }

    @Override
    public void assertCanAccess(String entityId, Profile currentProfile) {
        if (currentProfile == null) {
            throw new MediaUnauthenticatedException("Authentication required to access message media.");
        }

        Integer participant = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM chat_participants " +
                "WHERE chat_id = ? AND profile_id = ? AND deleted_at IS NULL",
                Integer.class, Long.parseLong(entityId), currentProfile.getId());

        if (participant == null || participant == 0) {
            throw new MediaAccessDeniedException("You are not a participant of this chat.");
        }
    }
}
