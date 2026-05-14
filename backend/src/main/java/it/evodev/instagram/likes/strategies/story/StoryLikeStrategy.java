package it.evodev.instagram.likes.strategies.story;

import it.evodev.instagram.likes.exceptions.LikeableNotFoundException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// TODO: replace JdbcTemplate with StoryRepository injection when the stories module
//  is migrated to Spring Boot — all jdbc calls here become repository method calls
@Component
public class StoryLikeStrategy implements LikeStrategy {

    private final JdbcTemplate jdbc;

    public StoryLikeStrategy(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public LikeableType supportedType() {
        return LikeableType.STORY;
    }

    @Override
    public void validateExists(Long likeableId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stories WHERE id = ? AND deleted_at IS NULL AND expires_at > NOW()",
                Integer.class, likeableId);
        if (count == null || count == 0) {
            throw new LikeableNotFoundException("Story not found or expired: " + likeableId);
        }
    }

    @Override
    public void adjustCount(Long likeableId, int delta) {
        // stories has no denormalized likes_count column — count is always derived
    }

    @Override
    public long getCount(Long likeableId) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM likes WHERE likeable_type = 'story' AND likeable_id = ? AND deleted_at IS NULL",
                Long.class, likeableId);
        return count != null ? count : 0L;
    }

    @Override
    public Long resolveAuthorProfileId(Long likeableId) {
        return jdbc.queryForObject(
                "SELECT profile_id FROM stories WHERE id = ? AND deleted_at IS NULL",
                Long.class, likeableId);
    }
}
