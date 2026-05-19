package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.posts.dto.response.PostSaveDataDTO;
import it.evodev.instagram.posts.exception.PostSaveNotFoundException;
import it.evodev.instagram.posts.exception.PostSaveUnauthorizedException;
import it.evodev.instagram.posts.exception.PostSaveValidationException;
import it.evodev.instagram.posts.model.PostSaveSavedPost;
import it.evodev.instagram.posts.repository.PostSavePostRepository;
import it.evodev.instagram.posts.repository.PostSaveSavedPostRepository;
import it.evodev.instagram.posts.service.PostsSaveService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostsSaveServiceImpl implements PostsSaveService {

    private static final Logger logger = LoggerFactory.getLogger(PostsSaveServiceImpl.class);

    private final ProfileRepository profileRepository;
    private final PostSavePostRepository postSavePostRepository;
    private final PostSaveSavedPostRepository postSaveSavedPostRepository;

    @Override
    @Transactional
    public PostSaveDataDTO toggleSave(String authSubject, Long postId) {
        if (postId == null || postId <= 0) {
            throw new PostSaveValidationException("Post id must be a positive number");
        }

        UUID authSubjectUuid = parseAuthSubject(authSubject);
        Long profileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .orElseThrow(() -> new PostSaveUnauthorizedException("Authenticated profile not found"));

        logger.info("Toggle save started - profileId: {}, postId: {}", profileId, postId);

        if (!postSavePostRepository.existsByIdAndDeletedAtIsNull(postId)) {
            logger.warn("Toggle save failed - post not found, postId: {}", postId);
            throw new PostSaveNotFoundException("Post not found");
        }

        PostSaveSavedPost entity = postSaveSavedPostRepository
                .findTopByProfileIdAndPostIdOrderByCreatedAtDesc(profileId, postId)
                .orElse(null);

        if (entity == null) {
            entity = PostSaveSavedPost.create(profileId, postId);
        } else {
            entity.toggle();
        }

        postSaveSavedPostRepository.save(entity);
        boolean saved = entity.isActive();
        logger.info("Toggle save completed - profileId: {}, postId: {}, saved: {}", profileId, postId, saved);

        return new PostSaveDataDTO(saved);
    }

    private UUID parseAuthSubject(String authSubject) {
        try {
            return UUID.fromString(authSubject);
        } catch (IllegalArgumentException exception) {
            logger.warn("Invalid authentication subject format");
            throw new PostSaveUnauthorizedException("Authentication subject is invalid");
        }
    }
}
