package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequiredArgsConstructor
@Slf4j
public class StorySeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    public void seedStories(List<Long> profileIds) {
        log.info("[StorySeeder] Seeding stories...");

        OffsetDateTime expiresAt = OffsetDateTime.now().plusYears(99);
        int total = 0;

        for (int i = 0; i < profileIds.size(); i++) {
            long profileId = profileIds.get(i);
            int numStories = 3 + data.nextInt(6); // 3-8

            for (int j = 0; j < numStories; j++) {
                jdbc.update(
                    "INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, expires_at)" +
                    " VALUES (?, ?, 'image', 5, ?)",
                    profileId,
                    "https://picsum.photos/seed/story" + profileId + "img" + j + "/1080/1920",
                    expiresAt
                );
                total++;
            }

            if ((i + 1) % 20 == 0) {
                log.info("[StorySeeder]   stories: {}/{} profiles", i + 1, profileIds.size());
            }
        }

        log.info("[StorySeeder]   → {} stories created (expire in 99 years)", total);
    }

    public void seedViews(List<Long> profileIds) {
        log.info("[StorySeeder] Seeding story views...");

        Map<Long, Long> storyOwner = new LinkedHashMap<>();
        jdbc.query(
            "SELECT id, profile_id FROM stories",
            (RowCallbackHandler) rs -> storyOwner.put(rs.getLong("id"), rs.getLong("profile_id"))
        );

        Map<Long, Set<Long>> followMap = data.buildFollowMap(jdbc);
        Set<String> seen = new HashSet<>();
        int total = 0;

        for (Map.Entry<Long, Long> entry : storyOwner.entrySet()) {
            long storyId = entry.getKey();
            long ownerId = entry.getValue();

            for (long profileId : profileIds) {
                if (ownerId == profileId) {
                    if (data.chance(0.3)) continue; // 30% non guarda la propria storia
                } else {
                    if (!followMap.getOrDefault(profileId, Set.of()).contains(ownerId)) continue;
                }

                if (!data.chance(0.40)) continue;
                if (!seen.add(storyId + "-" + profileId)) continue;

                try {
                    jdbc.update("INSERT INTO story_views (story_id, viewer_profile_id) VALUES (?, ?)", storyId, profileId);
                    jdbc.update("UPDATE stories SET views_count = views_count + 1 WHERE id = ?", storyId);
                    total++;
                } catch (Exception ignored) {}
            }
        }

        log.info("[StorySeeder]   → {} story views registered", total);
    }
}
