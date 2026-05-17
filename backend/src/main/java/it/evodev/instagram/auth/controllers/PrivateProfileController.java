package it.evodev.instagram.auth.controllers;

import it.evodev.instagram.auth.dto.ProfileImageResponseDTO;
import it.evodev.instagram.auth.exceptions.ProfileImageValidationException;
import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.media.service.BlobStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.PushbackInputStream;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class PrivateProfileController {

    private static final Logger logger = LoggerFactory.getLogger(PrivateProfileController.class);
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

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

    @PutMapping("/me/image")
    public ResponseEntity<ProfileImageResponseDTO> uploadImage(
            @RequestParam("image") MultipartFile file,
            Authentication authentication) throws IOException {

        Profile profile = resolveProfile(authentication);

        if (file == null || file.isEmpty()) {
            throw new ProfileImageValidationException("MISSING_FILE", "No file provided.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ProfileImageValidationException("FILE_TOO_LARGE", "File exceeds 5 MB limit.");
        }

        PushbackInputStream pushback = new PushbackInputStream(file.getInputStream(), 12);
        String detectedMime = detectMimeType(pushback);
        String ext = MIME_TO_EXT.get(detectedMime);

        String blobName = "profiles/" + profile.getId() + "/" + UUID.randomUUID() + ext;
        String existingUrl = profile.getProfileImageUrl();

        blobStorageService.upload(pushback, file.getSize(), detectedMime, blobName);

        profileRepository.updateProfileImageUrl(profile.getId(), blobName);

        if (existingUrl != null) {
            try {
                blobStorageService.delete(existingUrl);
            } catch (Exception e) {
                logger.warn("Failed to delete old blob: {}", existingUrl);
            }
        }

        return ResponseEntity.ok(new ProfileImageResponseDTO(true, blobName));
    }

    @DeleteMapping("/me/image")
    public ResponseEntity<ProfileImageResponseDTO> removeImage(Authentication authentication) {
        Profile profile = resolveProfile(authentication);

        String existingUrl = profile.getProfileImageUrl();
        if (existingUrl == null) {
            throw new ProfileImageValidationException("NO_IMAGE", "No profile image to remove.");
        }

        profileRepository.updateProfileImageUrl(profile.getId(), null);

        try {
            blobStorageService.delete(existingUrl);
        } catch (Exception e) {
            logger.warn("Failed to delete blob: {}", existingUrl);
        }

        return ResponseEntity.ok(new ProfileImageResponseDTO(true, null));
    }

    private Profile resolveProfile(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ProfileImageValidationException("PROFILE_NOT_FOUND", "Profile not found."));
    }

    private String detectMimeType(PushbackInputStream stream) throws IOException {
        byte[] header = stream.readNBytes(12);
        stream.unread(header);

        for (Map.Entry<String, byte[]> entry : MAGIC_BYTES.entrySet()) {
            byte[] magic = entry.getValue();
            if (header.length >= magic.length && startsWith(header, magic)) {
                // WebP extra check: bytes 8–11 must equal "WEBP"
                if ("image/webp".equals(entry.getKey())) {
                    if (header.length < 12 || header[8] != 'W' || header[9] != 'E'
                            || header[10] != 'B' || header[11] != 'P') {
                        continue;
                    }
                }
                return entry.getKey();
            }
        }
        throw new ProfileImageValidationException("INVALID_MIME_TYPE",
                "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.");
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
