package it.evodev.instagram.media.service;

import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.media.dto.StreamableMedia;
import it.evodev.instagram.media.enums.MediaCategory;
import it.evodev.instagram.media.exceptions.InvalidMediaPathException;
import it.evodev.instagram.media.exceptions.MediaNotFoundException;
import it.evodev.instagram.media.strategies.MediaAccessStrategyRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaService {

    private static final Logger logger = LoggerFactory.getLogger(MediaService.class);

    private static final Map<String, String> MIME_TYPES = Map.ofEntries(
            Map.entry(".jpg",  "image/jpeg"),
            Map.entry(".jpeg", "image/jpeg"),
            Map.entry(".png",  "image/png"),
            Map.entry(".gif",  "image/gif"),
            Map.entry(".webp", "image/webp"),
            Map.entry(".mp4",  "video/mp4"),
            Map.entry(".mov",  "video/quicktime"),
            Map.entry(".webm", "video/webm"),
            Map.entry(".mp3",  "audio/mpeg"),
            Map.entry(".pdf",  "application/pdf")
    );

    private final BlobStorageService blobStorageService;
    private final MediaAccessStrategyRegistry strategyRegistry;
    private final ProfileRepository profileRepository;

    public StreamableMedia resolveMedia(String category, String entityId, String filename, Authentication authentication) {
        validatePath(entityId, filename);

        MediaCategory mediaCategory = MediaCategory.fromPath(category);
        Profile currentProfile = resolveProfile(authentication);

        strategyRegistry.resolve(mediaCategory).assertCanAccess(entityId, currentProfile);

        String blobName = mediaCategory.getPath() + "/" + entityId + "/" + filename;

        long blobSize = blobStorageService.getSize(blobName);
        if (blobSize < 0) {
            throw new MediaNotFoundException("Media not found: " + blobName);
        }

        InputStream blobStream = blobStorageService.download(blobName);
        if (blobStream == null) {
            throw new MediaNotFoundException("Media not found: " + blobName);
        }

        logger.debug("Serving media blob: {}", blobName);
        return new StreamableMedia(blobStream, blobSize, resolveContentType(filename));
    }

    private void validatePath(String entityId, String filename) {
        if (!entityId.matches("^[0-9]+$")) {
            throw new InvalidMediaPathException("Invalid entityId: " + entityId);
        }
        if (!filename.matches("^[a-zA-Z0-9._-]+$")) {
            throw new InvalidMediaPathException("Invalid filename: " + filename);
        }
    }

    private Profile resolveProfile(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        String name = authentication.getName();
        if (name == null) return null;
        try {
            return profileRepository.findByUserIdAndDeletedAtIsNull(UUID.fromString(name)).orElse(null);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String resolveContentType(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return "application/octet-stream";
        return MIME_TYPES.getOrDefault(filename.substring(dot).toLowerCase(), "application/octet-stream");
    }
}
