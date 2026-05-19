package it.evodev.instagram.profile.picture.services.impl;

import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.media.services.BlobStorageService;
import it.evodev.instagram.profile.picture.exceptions.ProfilePictureException;
import it.evodev.instagram.profile.picture.config.ProfilePictureProperties;
import it.evodev.instagram.profile.picture.services.ProfilePictureService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfilePictureServiceImpl implements ProfilePictureService {

    private static final Logger logger = LoggerFactory.getLogger(ProfilePictureServiceImpl.class);

    private final ProfilePictureProperties properties;

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png",  new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47},
            "image/gif",  new byte[]{0x47, 0x49, 0x46, 0x38},
            "image/webp", new byte[]{0x52, 0x49, 0x46, 0x46}
    );

    private static final Map<String, String> MIME_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png",  ".png",
            "image/gif",  ".gif",
            "image/webp", ".webp"
    );

    private final ProfileRepository profileRepository;
    private final BlobStorageService blobStorageService;

    @Override
    public String uploadPicture(UUID userId, MultipartFile file) throws IOException {
        Profile profile = resolveProfile(userId);

        if (file == null || file.isEmpty()) {
            throw new ProfilePictureException("MISSING_FILE", "No file provided.");
        }
        if (file.getSize() > properties.getMaxFileSize().toBytes()) {
            throw new ProfilePictureException("FILE_TOO_LARGE",
                    "File exceeds " + properties.getMaxFileSize().toMegabytes() + " MB limit.");
        }

        byte[] bytes = file.getBytes();
        String detectedMime = detectMimeType(bytes);
        String ext = MIME_TO_EXT.get(detectedMime);

        String blobName = "profiles/" + profile.getId() + "/" + UUID.randomUUID() + ext;
        String existingUrl = profile.getProfileImageUrl();

        blobStorageService.upload(new ByteArrayInputStream(bytes), bytes.length, detectedMime, blobName);
        profileRepository.updateProfileImageUrl(profile.getId(), blobName);

        if (existingUrl != null) {
            try {
                blobStorageService.delete(existingUrl);
            } catch (Exception e) {
                logger.warn("Failed to delete old blob [profileId={}, blob={}]: {}", profile.getId(), existingUrl, e.getMessage());
            }
        }

        logger.info("Profile picture uploaded [profileId={}, blob={}]", profile.getId(), blobName);
        return blobName;
    }

    @Override
    public void removePicture(UUID userId) {
        Profile profile = resolveProfile(userId);

        String existingUrl = profile.getProfileImageUrl();
        if (existingUrl == null) {
            throw new ProfilePictureException("NO_IMAGE", "No profile picture to remove.");
        }

        profileRepository.updateProfileImageUrl(profile.getId(), null);

        try {
            blobStorageService.delete(existingUrl);
        } catch (Exception e) {
            logger.warn("Failed to delete blob [profileId={}, blob={}]: {}", profile.getId(), existingUrl, e.getMessage());
        }

        logger.info("Profile picture removed [profileId={}]", profile.getId());
    }

    private Profile resolveProfile(UUID userId) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found."));
    }

    private String detectMimeType(byte[] bytes) {
        for (Map.Entry<String, byte[]> entry : MAGIC_BYTES.entrySet()) {
            byte[] magic = entry.getValue();
            if (bytes.length >= magic.length && startsWith(bytes, magic)) {
                if ("image/webp".equals(entry.getKey())) {
                    if (bytes.length < 12 || bytes[8] != 'W' || bytes[9] != 'E'
                            || bytes[10] != 'B' || bytes[11] != 'P') {
                        continue;
                    }
                }
                return entry.getKey();
            }
        }
        throw new ProfilePictureException("INVALID_MIME_TYPE",
                "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.");
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
