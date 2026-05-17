package it.evodev.instagram.media.strategies;

import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.MediaAccessDeniedException;
import it.evodev.instagram.media.exceptions.MediaNotFoundException;
import it.evodev.instagram.media.exceptions.MediaUnauthenticatedException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class PostMediaAccessStrategy implements MediaAccessStrategy {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public MediaCategory supportedCategory() {
        return MediaCategory.POSTS;
    }

    @Override
    public void assertCanAccess(String entityId, Profile currentProfile) {
        var rows = jdbcTemplate.queryForList(
                "SELECT p.profile_id, pr.is_private FROM posts p " +
                "JOIN profiles pr ON pr.id = p.profile_id " +
                "WHERE p.id = ? AND p.deleted_at IS NULL AND pr.deleted_at IS NULL",
                Long.parseLong(entityId));

        if (rows.isEmpty()) {
            throw new MediaNotFoundException("Post not found: " + entityId);
        }

        Map<String, Object> row = rows.getFirst();
        boolean isPrivate = Boolean.TRUE.equals(row.get("is_private"));
        if (!isPrivate) return;

        if (currentProfile == null) {
            throw new MediaUnauthenticatedException("Authentication required to access private post media.");
        }

        long postProfileId = ((Number) row.get("profile_id")).longValue();
        if (currentProfile.getId().equals(postProfileId)) return;

        Integer followed = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM follows " +
                "WHERE follower_profile_id = ? AND following_profile_id = ? " +
                "AND status = 'accepted' AND deleted_at IS NULL",
                Integer.class, currentProfile.getId(), postProfileId);

        if (followed == null || followed == 0) {
            throw new MediaAccessDeniedException("You must follow this account to view its content.");
        }
    }
}
