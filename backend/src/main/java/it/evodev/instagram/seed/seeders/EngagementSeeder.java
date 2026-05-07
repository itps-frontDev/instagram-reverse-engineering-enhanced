package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequiredArgsConstructor
@Slf4j
public class EngagementSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    // ── POST LIKES ───────────────────────────────────────────────────────────

    public void seedLikes(List<Long> allMediaIds, List<Long> profileIds) {
        log.info("[EngagementSeeder] Seeding post likes...");

        PostData posts       = loadPostData();
        Map<Long, Set<Long>> followMap = data.buildFollowMap(jdbc);
        Set<String> seen     = new HashSet<>();
        int total            = 0;

        for (long profileId : profileIds) {
            Set<Long> following = followMap.getOrDefault(profileId, Set.of());

            for (long postId : allMediaIds) {
                if (!data.chance(0.35)) continue;
                if (!canInteract(posts, postId, profileId, following)) continue;
                if (!seen.add(profileId + "-" + postId)) continue;

                try {
                    jdbc.update("INSERT INTO post_likes (profile_id, post_id) VALUES (?, ?)", profileId, postId);
                    jdbc.update("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", postId);
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[EngagementSeeder]   → {} post likes created", total);
    }

    // ── SAVED POSTS ──────────────────────────────────────────────────────────

    public void seedSaved(List<Long> allMediaIds, List<Long> profileIds) {
        log.info("[EngagementSeeder] Seeding saved posts...");

        PostData posts       = loadPostData();
        Map<Long, Set<Long>> followMap = data.buildFollowMap(jdbc);
        Set<String> seen     = new HashSet<>();
        int total            = 0;

        for (long profileId : profileIds) {
            Set<Long> following = followMap.getOrDefault(profileId, Set.of());

            for (long postId : allMediaIds) {
                if (!data.chance(0.015)) continue;
                if (!canInteract(posts, postId, profileId, following)) continue;
                if (!seen.add(profileId + "-" + postId)) continue;

                try {
                    jdbc.update("INSERT INTO saved_posts (post_id, profile_id) VALUES (?, ?)", postId, profileId);
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[EngagementSeeder]   → {} saved posts created", total);
    }

    // ── POST COMMENTS ────────────────────────────────────────────────────────

    public void seedComments(List<Long> allMediaIds, List<Long> profileIds) {
        log.info("[EngagementSeeder] Seeding comments...");

        PostData posts       = loadPostData();
        Map<Long, Set<Long>> followMap = data.buildFollowMap(jdbc);
        int total            = 0;

        for (long postId : allMediaIds) {
            int numComments = data.nextInt(8); // 0-7

            for (int i = 0; i < numComments; i++) {
                long profileId  = data.pick(profileIds);
                Set<Long> following = followMap.getOrDefault(profileId, Set.of());
                if (!canInteract(posts, postId, profileId, following)) continue;

                try {
                    jdbc.update(
                        "INSERT INTO comments (post_id, profile_id, text) VALUES (?, ?, ?)",
                        postId, profileId, data.pick(SeedData.COMMENT_TEMPLATES)
                    );
                    jdbc.update("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?", postId);
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[EngagementSeeder]   → {} comments created", total);
    }

    // ── COMMENT LIKES ────────────────────────────────────────────────────────

    public void seedCommentLikes(List<Long> profileIds) {
        log.info("[EngagementSeeder] Seeding comment likes...");

        List<Long> commentIds = jdbc.queryForList("SELECT id FROM comments", Long.class);
        Set<String> seen      = new HashSet<>();
        int total             = 0;

        for (long commentId : commentIds) {
            for (long profileId : profileIds) {
                if (!data.chance(0.08)) continue;
                if (!seen.add(profileId + "-" + commentId)) continue;

                try {
                    jdbc.update("INSERT INTO comment_likes (profile_id, comment_id) VALUES (?, ?)", profileId, commentId);
                    jdbc.update("UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?", commentId);
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[EngagementSeeder]   → {} comment likes created", total);
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    private boolean canInteract(PostData posts, long postId, long profileId, Set<Long> following) {
        boolean isPrivate = posts.isPrivate().getOrDefault(postId, false);
        long ownerId      = posts.ownerId().getOrDefault(postId, -1L);
        return !isPrivate || ownerId == profileId || following.contains(ownerId);
    }

    private PostData loadPostData() {
        Map<Long, Boolean> isPrivate = new HashMap<>();
        Map<Long, Long>    ownerId   = new HashMap<>();
        jdbc.query(
            "SELECT p.id, p.profile_id, pr.is_private FROM posts p JOIN profiles pr ON p.profile_id = pr.id",
            (RowCallbackHandler) rs -> {
                isPrivate.put(rs.getLong("id"), rs.getBoolean("is_private"));
                ownerId.put(rs.getLong("id"), rs.getLong("profile_id"));
            }
        );
        return new PostData(isPrivate, ownerId);
    }

    private record PostData(Map<Long, Boolean> isPrivate, Map<Long, Long> ownerId) {}
}
