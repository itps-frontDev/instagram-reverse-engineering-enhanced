package it.evodev.instagram.likes.strategies.post;

import it.evodev.instagram.likes.exceptions.LikeableNotFoundException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// TODO: replace JdbcTemplate with PostRepository injection when the posts module
//  is migrated to Spring Boot — all jdbc calls here become repository method calls
@Component
public class PostLikeStrategy implements LikeStrategy {

    private final JdbcTemplate jdbc;

    public PostLikeStrategy(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public LikeableType supportedType() {
        return LikeableType.POST;
    }

    @Override
    public void validateExists(Long likeableId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM posts WHERE id = ? AND deleted_at IS NULL",
                Integer.class, likeableId);
        if (count == null || count == 0) {
            throw new LikeableNotFoundException("Post not found: " + likeableId);
        }
    }

    @Override
    public void adjustCount(Long likeableId, int delta) {
        jdbc.update(
                "UPDATE posts SET likes_count = GREATEST(0, likes_count + ?) WHERE id = ?",
                delta, likeableId);
    }

    @Override
    public long getCount(Long likeableId) {
        Long count = jdbc.queryForObject(
                "SELECT likes_count FROM posts WHERE id = ?",
                Long.class, likeableId);
        return count != null ? count : 0L;
    }

    @Override
    public Long resolveAuthorProfileId(Long likeableId) {
        return jdbc.queryForObject(
                "SELECT profile_id FROM posts WHERE id = ? AND deleted_at IS NULL",
                Long.class, likeableId);
    }
}
