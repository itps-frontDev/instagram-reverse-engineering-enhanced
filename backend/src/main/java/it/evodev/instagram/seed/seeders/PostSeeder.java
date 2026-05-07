package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequiredArgsConstructor
@Slf4j
public class PostSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    public List<Long> seedPosts(List<Long> profileIds) {
        log.info("[PostSeeder] Seeding posts...");
        List<Long> ids = new ArrayList<>();

        for (int i = 0; i < profileIds.size(); i++) {
            long profileId = profileIds.get(i);
            int numPosts   = 8 + data.nextInt(8); // 8-15

            for (int j = 0; j < numPosts; j++) {
                int mediaCount = data.chance(0.3) ? 2 + data.nextInt(4) : 1;

                Long postId = jdbc.queryForObject(
                    "INSERT INTO posts (profile_id, caption, likes_count, comments_count)" +
                    " VALUES (?, ?, ?, ?) RETURNING id",
                    Long.class,
                    profileId, data.pick(SeedData.POST_CAPTIONS),
                    10 + data.nextInt(491), data.nextInt(51)
                );

                for (int k = 0; k < mediaCount; k++) {
                    jdbc.update(
                        "INSERT INTO post_media (post_id, media_url, media_type, position) VALUES (?, ?, 'image', ?)",
                        postId, "https://picsum.photos/seed/post" + postId + "img" + k + "/1080/1350", k
                    );
                }

                ids.add(postId);
            }

            jdbc.update("UPDATE profiles SET posts_count = ? WHERE id = ?", numPosts, profileId);

            if ((i + 1) % 20 == 0) {
                log.info("[PostSeeder]   posts: {}/{} profiles", i + 1, profileIds.size());
            }
        }

        log.info("[PostSeeder]   → {} posts created", ids.size());
        return ids;
    }

    public List<Long> seedReels(List<Long> profileIds) {
        log.info("[PostSeeder] Seeding video reels...");
        List<Long> ids = new ArrayList<>();

        for (int i = 0; i < Math.min(SeedData.TARGET_REELS, profileIds.size()); i++) {
            long profileId = profileIds.get(i);

            Long postId = jdbc.queryForObject(
                "INSERT INTO posts (profile_id, caption, likes_count, comments_count)" +
                " VALUES (?, ?, ?, ?) RETURNING id",
                Long.class,
                profileId, data.pick(SeedData.REEL_CAPTIONS),
                1000 + data.nextInt(99001), 50 + data.nextInt(951)
            );

            jdbc.update(
                "INSERT INTO post_media (post_id, media_url, media_type, duration_seconds, position)" +
                " VALUES (?, ?, 'video', ?, 0)",
                postId, data.pick(SeedData.VIDEO_URLS), (double) (5 + data.nextInt(56))
            );

            jdbc.update(
                "UPDATE profiles SET posts_count = (" +
                "  SELECT COUNT(*) FROM posts WHERE profile_id = ? AND deleted_at IS NULL" +
                ") WHERE id = ?",
                profileId, profileId
            );

            ids.add(postId);
        }

        log.info("[PostSeeder]   → {} reels created", ids.size());
        return ids;
    }

    public void seedTags(List<Long> postIds, List<Long> reelIds, List<Long> profileIds) {
        log.info("[PostSeeder] Seeding post tags...");

        List<Long> all = new ArrayList<>(postIds);
        all.addAll(reelIds);
        int total = 0;

        for (long postId : all) {
            if (!data.chance(0.4)) continue;

            int numTags = 1 + data.nextInt(3);
            Set<Long> tagged = new HashSet<>();

            for (int i = 0; i < numTags; i++) {
                long profileId = data.pick(profileIds);
                if (!tagged.add(profileId)) continue;
                try {
                    jdbc.update(
                        "INSERT INTO post_tags (post_id, tagged_profile_id, x_position, y_position)" +
                        " VALUES (?, ?, ?, ?)",
                        postId, profileId, data.nextDouble(), data.nextDouble()
                    );
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[PostSeeder]   → {} post tags created", total);
    }
}
