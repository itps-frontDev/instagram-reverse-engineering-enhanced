package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.posts.dto.response.PostSaveDataDTO;
import it.evodev.instagram.posts.exception.PostSaveNotFoundException;
import it.evodev.instagram.posts.exception.PostSaveUnauthorizedException;
import it.evodev.instagram.posts.exception.PostSaveValidationException;
import it.evodev.instagram.posts.model.SavedPost;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.SavedPostRepository;
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
    private final PostRepository postRepository;
    private final SavedPostRepository savedPostRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    @Transactional
    public PostSaveDataDTO toggleSave(String authSubject, Long postId) {
        if (postId == null || postId <= 0) {
            throw new PostSaveValidationException("Post id must be a positive number");
        }

        UUID authSubjectUuid = authSubjectService.parseUserId(
                authSubject,
                () -> new PostSaveUnauthorizedException("Authentication subject is invalid")
        );
        Long profileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .orElseThrow(() -> new PostSaveUnauthorizedException("Authenticated profile not found"));

        logger.info("Toggle save started - profileId: {}, postId: {}", profileId, postId);

        if (!postRepository.existsByIdAndDeletedAtIsNull(postId)) {
            logger.warn("Toggle save failed - post not found, postId: {}", postId);
            throw new PostSaveNotFoundException("Post not found");
        }

        SavedPost entity = savedPostRepository
                .findTopByProfileIdAndPostIdOrderByCreatedAtDesc(profileId, postId)
                .orElse(null);

        if (entity == null) {
            entity = SavedPost.create(profileId, postId);
        } else {
            entity.toggle();
        }

        savedPostRepository.save(entity);
        boolean saved = entity.isActive();
        logger.info("Toggle save completed - profileId: {}, postId: {}, saved: {}", profileId, postId, saved);

        return new PostSaveDataDTO(saved);
    }

}
