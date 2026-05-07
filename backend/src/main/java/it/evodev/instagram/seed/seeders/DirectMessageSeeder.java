package it.evodev.instagram.seed.seeders;

import it.evodev.instagram.seed.SeedData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
public class DirectMessageSeeder {

    private final JdbcTemplate jdbc;
    private final SeedData data;

    public void seed(List<Long> profileIds) {
        log.info("[DirectMessageSeeder] Seeding direct messages...");

        int totalChats = 0, totalMessages = 0;

        for (int i = 0; i < profileIds.size(); i++) {
            for (int j = i + 1; j < profileIds.size(); j++) {
                if (!data.chance(0.20)) continue;

                long p1 = profileIds.get(i);
                long p2 = profileIds.get(j);

                Long chatId = jdbc.queryForObject(
                    "INSERT INTO chats DEFAULT VALUES RETURNING id",
                    Long.class
                );

                jdbc.update("INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)", chatId, p1);
                jdbc.update("INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)", chatId, p2);

                int numMessages = 3 + data.nextInt(8);
                for (int k = 0; k < numMessages; k++) {
                    long senderId = data.nextBoolean() ? p1 : p2;
                    jdbc.update(
                        "INSERT INTO messages (chat_id, sender_profile_id, text) VALUES (?, ?, ?)",
                        chatId, senderId, data.pick(SeedData.MESSAGE_TEMPLATES)
                    );
                    totalMessages++;
                }

                jdbc.update("UPDATE chats SET last_message_at = NOW() WHERE id = ?", chatId);
                totalChats++;
            }

            if ((i + 1) % 20 == 0) {
                log.info("[DirectMessageSeeder]   {}/{} profiles processed", i + 1, profileIds.size());
            }
        }

        log.info("[DirectMessageSeeder]   → {} chats with {} messages created", totalChats, totalMessages);
    }
}
