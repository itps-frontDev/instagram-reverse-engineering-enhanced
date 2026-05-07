package it.evodev.instagram.seed;

import it.evodev.instagram.seed.seeders.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    @Override
    public void run(String... args) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        if (count != null && count > 0) {
            log.info("[Seed] Database already seeded — skipping");
            return;
        }

        log.info("[Seed] Starting with {} users...", SeedData.NUM_USERS);
        long start = System.currentTimeMillis();

        List<Long> userIds    = new UserSeeder(jdbc, data).seed();
        List<Long> profileIds = new ProfileSeeder(jdbc, data).seed(userIds);

        PostSeeder postSeeder = new PostSeeder(jdbc, data);
        List<Long> postIds    = postSeeder.seedPosts(profileIds);
        List<Long> reelIds    = postSeeder.seedReels(profileIds);
        postSeeder.seedTags(postIds, reelIds, profileIds);

        List<Long> allMediaIds = new ArrayList<>(postIds);
        allMediaIds.addAll(reelIds);

        EngagementSeeder engagement = new EngagementSeeder(jdbc, data);
        engagement.seedLikes(allMediaIds, profileIds);
        engagement.seedSaved(allMediaIds, profileIds);
        engagement.seedComments(allMediaIds, profileIds);
        engagement.seedCommentLikes(profileIds);

        new FollowSeeder(jdbc, data).seed(profileIds);

        StorySeeder storySeeder = new StorySeeder(jdbc, data);
        storySeeder.seedStories(profileIds);
        storySeeder.seedViews(profileIds);

        new DirectMessageSeeder(jdbc, data).seed(profileIds);

        long elapsed = (System.currentTimeMillis() - start) / 1000;
        log.info("[Seed] Completed in {}s — password for all accounts: password123", elapsed);
    }
}
