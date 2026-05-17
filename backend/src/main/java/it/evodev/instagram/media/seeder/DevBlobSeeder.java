package it.evodev.instagram.media.seeder;

import it.evodev.instagram.media.service.BlobStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevBlobSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(DevBlobSeeder.class);
    private static final int    THREAD_POOL_SIZE = 20;
    private static final int    HTTP_TIMEOUT_MS  = 15_000;

    private final BlobStorageService blobStorageService;
    private final JdbcTemplate jdbcTemplate;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofMillis(HTTP_TIMEOUT_MS))
            .build();

    @Override
    public void run(ApplicationArguments args) {
        logger.info("[DevBlobSeeder] Starting blob migration...");

        int profiles  = seedProfiles();
        int postImgs  = seedPostImages();
        int stories   = seedStories();
        int reels     = seedReels();

        logger.info("[DevBlobSeeder] Done — profiles: {}, post images: {}, stories: {}, reels: {}",
                profiles, postImgs, stories, reels);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Seed methods
    // ──────────────────────────────────────────────────────────────────────────

    private int seedProfiles() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, username FROM profiles WHERE deleted_at IS NULL");
        return processInParallel(rows, row -> {
            long id = ((Number) row.get("id")).longValue();
            String username = row.get("username").toString();
            String blobName = "profiles/" + id + "/avatar.jpg";
            String url = "https://i.pravatar.cc/150?u=" + username;
            uploadIfAbsent(blobName, url, "image/jpeg");
            jdbcTemplate.update("UPDATE profiles SET profile_image_url = ? WHERE id = ?",
                    blobName, id);
        });
    }

    private int seedPostImages() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, post_id, position, media_url FROM post_media " +
                "WHERE media_type = 'image' AND media_url LIKE 'http%'");
        return processInParallel(rows, row -> {
            long id     = ((Number) row.get("id")).longValue();
            long postId = ((Number) row.get("post_id")).longValue();
            int  pos    = ((Number) row.get("position")).intValue();
            String blobName = "posts/" + postId + "/image-" + pos + ".jpg";
            String url = "https://picsum.photos/seed/post" + postId + "idx" + pos + "/800/1000";
            uploadIfAbsent(blobName, url, "image/jpeg");
            jdbcTemplate.update("UPDATE post_media SET media_url = ? WHERE id = ?",
                    blobName, id);
        });
    }

    private int seedStories() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT s.id, s.profile_id, " +
                "ROW_NUMBER() OVER (PARTITION BY s.profile_id ORDER BY s.id) - 1 AS story_idx, " +
                "s.media_url FROM stories s WHERE s.media_url LIKE 'http%'");
        return processInParallel(rows, row -> {
            long id        = ((Number) row.get("id")).longValue();
            long profileId = ((Number) row.get("profile_id")).longValue();
            long storyIdx  = ((Number) row.get("story_idx")).longValue();
            String blobName = "stories/" + id + "/media.jpg";
            String url = "https://picsum.photos/seed/story" + profileId + "idx" + storyIdx + "/800/1000";
            uploadIfAbsent(blobName, url, "image/jpeg");
            jdbcTemplate.update("UPDATE stories SET media_url = ? WHERE id = ?",
                    blobName, id);
        });
    }

    private static final List<String> REEL_PLACEHOLDER_URLS = List.of(
            "https://www.w3schools.com/html/mov_bbb.mp4",                              // 0.8 MB
            "https://media.w3.org/2010/05/video/movie_300.mp4",                       // 2.6 MB
            "https://media.w3.org/2010/05/sintel/trailer.mp4",                        // 4.2 MB
            "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",    // 4.2 MB
            "https://media.w3.org/2010/05/bunny/trailer.mp4"                          // 10.5 MB
    );

    private int seedReels() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, post_id FROM post_media WHERE media_type = 'video' AND media_url LIKE 'http%'");
        if (rows.isEmpty()) return 0;

        List<byte[]> placeholders = downloadPlaceholders(REEL_PLACEHOLDER_URLS);
        if (placeholders.isEmpty()) {
            logger.warn("[DevBlobSeeder] No placeholder videos available — skipping reels");
            return 0;
        }

        return processInParallel(rows, row -> {
            long id     = ((Number) row.get("id")).longValue();
            long postId = ((Number) row.get("post_id")).longValue();
            String blobName = "posts/" + postId + "/video.mp4";
            if (!blobStorageService.exists(blobName)) {
                byte[] data = placeholders.get((int) (id % placeholders.size()));
                blobStorageService.upload(new ByteArrayInputStream(data), data.length, "video/mp4", blobName);
            }
            jdbcTemplate.update("UPDATE post_media SET media_url = ? WHERE id = ?",
                    blobName, id);
        });
    }

    private List<byte[]> downloadPlaceholders(List<String> urls) {
        List<byte[]> result = new ArrayList<>();
        for (String url : urls) {
            try {
                result.add(download(url));
                logger.debug("[DevBlobSeeder] Downloaded placeholder from {}", url);
            } catch (Exception e) {
                logger.warn("[DevBlobSeeder] Skipping placeholder {}: {}", url, e.getMessage());
            }
        }
        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private void uploadIfAbsent(String blobName, String url, String contentType) {
        if (!blobStorageService.exists(blobName)) {
            byte[] data = download(url);
            blobStorageService.upload(new ByteArrayInputStream(data), data.length, contentType, blobName);
        }
    }

    private byte[] download(String url) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(HTTP_TIMEOUT_MS))
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                throw new RuntimeException("HTTP " + response.statusCode() + " for " + url);
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Download failed for " + url + ": " + e.getMessage(), e);
        }
    }

    private <T> int processInParallel(List<T> rows, Consumer<T> task) {
        if (rows.isEmpty()) return 0;
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        AtomicInteger successCount = new AtomicInteger(0);
        try {
            List<CompletableFuture<Void>> futures = rows.stream()
                    .map(row -> CompletableFuture.runAsync(() -> {
                        try {
                            task.accept(row);
                            successCount.incrementAndGet();
                        } catch (Exception e) {
                            logger.warn("[DevBlobSeeder] Failed to process row: {}", e.getMessage());
                        }
                    }, executor))
                    .toList();
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        } finally {
            executor.shutdown();
            try {
                executor.awaitTermination(60, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        return successCount.get();
    }
}
