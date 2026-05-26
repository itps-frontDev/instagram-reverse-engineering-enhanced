package it.evodev.instagram.media.strategies;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.MediaNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProfileMediaAccessStrategy implements MediaAccessStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public MediaCategory supportedCategory() {
        return MediaCategory.PROFILES;
    }

    @Override
    public void assertCanAccess(String entityId, Profile currentProfile) {
        Integer found = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM profiles WHERE id = ? AND deleted_at IS NULL",
                Integer.class, Long.parseLong(entityId));
        if (found == null || found == 0) {
            throw new MediaNotFoundException("Profile not found: " + entityId);
        }
        // Profile images are always public — no further checks
    }
}
