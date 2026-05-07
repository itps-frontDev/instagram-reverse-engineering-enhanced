package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Slf4j
public class ProfileSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    public List<Long> seed(List<Long> userIds) {
        log.info("[ProfileSeeder] Seeding {} profiles...", SeedData.NUM_USERS);
        List<Long> ids = new ArrayList<>(SeedData.NUM_USERS);

        for (int i = 0; i < SeedData.NUM_USERS; i++) {
            String first    = data.pick(SeedData.FIRST_NAMES);
            String last     = data.pick(SeedData.LAST_NAMES);
            String username = (first + last).toLowerCase() + (i == 0 ? "" : i);
            String fullName = first + " " + last;
            String bio      = data.chance(0.7) ? data.pick(SeedData.BIO_TEMPLATES) : null;
            String website  = data.chance(0.3) ? "https://" + username + ".com" : null;
            boolean isPrivate  = data.chance(0.25);
            boolean isVerified = data.chance(0.15);
            String imageUrl = i >= 4 ? "https://i.pravatar.cc/300?u=" + username : null;

            Long id = jdbc.queryForObject(
                "INSERT INTO profiles" +
                " (user_id, username, full_name, bio, website_url, profile_image_url," +
                "  is_private, is_verified, followers_count, following_count, posts_count)" +
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0) RETURNING id",
                Long.class,
                userIds.get(i), username, fullName, bio, website, imageUrl, isPrivate, isVerified
            );
            ids.add(id);
        }

        log.info("[ProfileSeeder]   → {} profiles created", ids.size());
        return ids;
    }
}
