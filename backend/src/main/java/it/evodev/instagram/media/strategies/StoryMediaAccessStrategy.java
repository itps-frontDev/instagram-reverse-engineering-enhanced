package it.evodev.instagram.media.strategies;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.MediaAccessDeniedException;
import it.evodev.instagram.media.exceptions.MediaNotFoundException;
import it.evodev.instagram.media.exceptions.MediaUnauthenticatedException;
import it.evodev.instagram.media.exceptions.StoryExpiredException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class StoryMediaAccessStrategy implements MediaAccessStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public MediaCategory supportedCategory() {
        return MediaCategory.STORIES;
    }

    @Override
    public void assertCanAccess(String entityId, Profile currentProfile) {
        if (currentProfile == null) {
            throw new MediaUnauthenticatedException("Authentication required to access story media.");
        }

        var rows = jdbcTemplate.queryForList(
                "SELECT s.profile_id, pr.is_private, s.expires_at FROM stories s " +
                "JOIN profiles pr ON pr.id = s.profile_id " +
                "WHERE s.id = ? AND s.deleted_at IS NULL AND pr.deleted_at IS NULL",
                Long.parseLong(entityId));

        if (rows.isEmpty()) {
            throw new MediaNotFoundException("Story not found: " + entityId);
        }

        Map<String, Object> row = rows.getFirst();
        Timestamp expiresAtTs = (Timestamp) row.get("expires_at");
        LocalDateTime expiresAt = expiresAtTs != null ? expiresAtTs.toLocalDateTime() : null;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) {
            throw new StoryExpiredException("Story has expired.");
        }

        boolean isPrivate = Boolean.TRUE.equals(row.get("is_private"));
        if (!isPrivate) return;

        long storyProfileId = ((Number) row.get("profile_id")).longValue();
        if (currentProfile.getId().equals(storyProfileId)) return;

        Integer followed = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM follows " +
                "WHERE follower_profile_id = ? AND following_profile_id = ? " +
                "AND status = 'accepted' AND deleted_at IS NULL",
                Integer.class, currentProfile.getId(), storyProfileId);

        if (followed == null || followed == 0) {
            throw new MediaAccessDeniedException("You must follow this account to view its stories.");
        }
    }
}
