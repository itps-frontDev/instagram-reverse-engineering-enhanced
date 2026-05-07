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
public class FollowSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    public void seed(List<Long> profileIds) {
        log.info("[FollowSeeder] Seeding social graph...");

        Map<Long, Boolean> privateMap = new HashMap<>();
        jdbc.query(
            "SELECT id, is_private FROM profiles",
            (RowCallbackHandler) rs -> privateMap.put(rs.getLong("id"), rs.getBoolean("is_private"))
        );

        Set<String> seen = new HashSet<>();
        int accepted = 0, pending = 0;

        for (int i = 0; i < profileIds.size(); i++) {
            for (int j = 0; j < profileIds.size(); j++) {
                if (i == j) continue;
                if (!data.chance(0.30)) continue;

                long follower  = profileIds.get(i);
                long following = profileIds.get(j);
                if (!seen.add(follower + "-" + following)) continue;

                boolean targetPrivate = privateMap.getOrDefault(following, false);
                boolean isPending     = targetPrivate && data.chance(0.15);
                String status         = isPending ? "pending" : "accepted";

                try {
                    jdbc.update(
                        "INSERT INTO follows (follower_profile_id, following_profile_id, status) VALUES (?, ?, ?)",
                        follower, following, status
                    );
                    if (isPending) pending++; else accepted++;
                } catch (Exception ignored) {}
            }

            if ((i + 1) % 20 == 0) {
                log.info("[FollowSeeder]   {}/{} profiles processed", i + 1, profileIds.size());
            }
        }

        updateFollowCounts(profileIds);
        log.info("[FollowSeeder]   → {} accepted + {} pending follows", accepted, pending);
    }

    private void updateFollowCounts(List<Long> profileIds) {
        for (long profileId : profileIds) {
            jdbc.update(
                "UPDATE profiles SET" +
                "  followers_count = (SELECT COUNT(*) FROM follows WHERE following_profile_id = ? AND deleted_at IS NULL AND status = 'accepted')," +
                "  following_count = (SELECT COUNT(*) FROM follows WHERE follower_profile_id  = ? AND deleted_at IS NULL AND status = 'accepted')" +
                " WHERE id = ?",
                profileId, profileId, profileId
            );
        }
    }
}
