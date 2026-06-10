package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.profile.repository.ProfileEditJpaRepository;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.media.exceptions.BlobStorageException;
import it.evodev.instagram.media.services.BlobStorageService;
import it.evodev.instagram.posts.dto.response.PostCreateResponseDTO;
import it.evodev.instagram.posts.exception.PostCreateUnauthorizedException;
import it.evodev.instagram.posts.exception.PostCreateValidationException;
import it.evodev.instagram.posts.model.Post;
import it.evodev.instagram.posts.model.PostMedia;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.PostMediaRepository;
import it.evodev.instagram.posts.service.PostCreateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostCreateServiceImpl implements PostCreateService {

    private static final Logger logger = LoggerFactory.getLogger(PostCreateServiceImpl.class);

    private static final int MAX_IMAGES = 10;
    private static final int MAX_CAPTION_LENGTH = 2200;

    private static final Map<String, byte[]> IMAGE_MAGIC_BYTES = Map.of(
        "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
        "image/png",  new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47},
        "image/gif",  new byte[]{0x47, 0x49, 0x46, 0x38},
        "image/webp", new byte[]{0x52, 0x49, 0x46, 0x46}
    );

    private static final Map<String, String> MIME_TO_EXT = Map.ofEntries(
        Map.entry("image/jpeg",      ".jpg"),
        Map.entry("image/png",       ".png"),
        Map.entry("image/gif",       ".gif"),
        Map.entry("image/webp",      ".webp"),
        Map.entry("video/mp4",       ".mp4"),
        Map.entry("video/quicktime", ".mov"),
        Map.entry("video/webm",      ".webm")
    );

    private final AuthSubjectService authSubjectService;
    private final ProfileJpaRepository profileRepository;
    private final ProfileEditJpaRepository profileEditRepository;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final BlobStorageService blobStorageService;

    @Override
    @Transactional
    public PostCreateResponseDTO createPost(
        String authSubject,
        List<MultipartFile> images,
        String caption,
        String location,
        boolean isCommentsDisabled,
        boolean isLikesHidden
    ) {
        if (images == null || images.isEmpty()) {
            throw new PostCreateValidationException("Almeno un'immagine è richiesta");
        }
        if (images.size() > MAX_IMAGES) {
            throw new PostCreateValidationException("Massimo " + MAX_IMAGES + " immagini consentite");
        }
        if (caption != null && caption.length() > MAX_CAPTION_LENGTH) {
            throw new PostCreateValidationException("Caption troppo lunga (max " + MAX_CAPTION_LENGTH + " caratteri)");
        }

        UUID userId = authSubjectService.parseUserId(authSubject,
            () -> new PostCreateUnauthorizedException("Authentication subject non valido"));

        Long profileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new PostCreateUnauthorizedException("Profilo non trovato"));

        logger.info("POST /api/priv/posts - creating post for profileId: {}, imageCount: {}", profileId, images.size());

        OffsetDateTime now = OffsetDateTime.now();

        Post post = new Post();
        post.setProfileId(profileId);
        post.setCaption(caption != null ? caption.trim() : null);
        post.setLocation(location != null ? location.trim() : null);
        post.setIsCommentsDisabled(isCommentsDisabled);
        post.setIsLikesHidden(isLikesHidden);
        post.setLikesCount(0);
        post.setCommentsCount(0);
        post.setCreatedAt(now);
        post.setUpdatedAt(now);

        Post saved = postRepository.save(post);
        Long postId = saved.getId();

        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            if (file.isEmpty()) {
                throw new PostCreateValidationException("Immagine alla posizione " + i + " è vuota");
            }

            byte[] bytes;
            try {
                bytes = file.getBytes();
            } catch (IOException e) {
                throw new PostCreateValidationException("Impossibile leggere l'immagine alla posizione " + i);
            }

            String mimeType = detectMimeType(bytes, i);
            String ext = MIME_TO_EXT.get(mimeType);
            String mediaType = mimeType.startsWith("video/") ? "video" : "image";
            String blobName = "posts/" + postId + "/" + mediaType + "-" + i + ext;

            blobStorageService.upload(new ByteArrayInputStream(bytes), bytes.length, mimeType, blobName);

            PostMedia media = new PostMedia();
            media.setPostId(postId);
            media.setMediaUrl(blobName);
            media.setMediaType(mediaType);
            media.setPosition(i);
            media.setCreatedAt(now);
            postMediaRepository.save(media);
        }

        profileEditRepository.incrementPostsCount(profileId);

        logger.info("POST /api/priv/posts - post created, postId: {}", postId);
        return new PostCreateResponseDTO(postId);
    }

    private String detectMimeType(byte[] bytes, int position) {
        // Image: magic bytes at offset 0
        for (Map.Entry<String, byte[]> entry : IMAGE_MAGIC_BYTES.entrySet()) {
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
        // WebM: EBML magic at offset 0  (1A 45 DF A3)
        if (bytes.length >= 4
                && (bytes[0] & 0xFF) == 0x1A && (bytes[1] & 0xFF) == 0x45
                && (bytes[2] & 0xFF) == 0xDF && (bytes[3] & 0xFF) == 0xA3) {
            return "video/webm";
        }
        // MP4 / MOV: ISO Base Media 'ftyp' box at offset 4
        if (bytes.length >= 8
                && bytes[4] == 0x66 && bytes[5] == 0x74 && bytes[6] == 0x79 && bytes[7] == 0x70) {
            // QuickTime brand: 'qt  ' (71 74 20 20)
            if (bytes.length >= 12 && (bytes[8] & 0xFF) == 0x71 && (bytes[9] & 0xFF) == 0x74) {
                return "video/quicktime";
            }
            return "video/mp4";
        }
        throw new PostCreateValidationException(
            "Formato non supportato alla posizione " + position + ". Formati ammessi: JPEG, PNG, GIF, WebP, MP4, MOV, WebM");
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
