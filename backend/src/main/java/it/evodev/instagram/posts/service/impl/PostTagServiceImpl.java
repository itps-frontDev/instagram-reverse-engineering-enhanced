package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.posts.dto.response.PostTagDTO;
import it.evodev.instagram.posts.exception.PostSaveNotFoundException;
import it.evodev.instagram.posts.exception.PostSaveUnauthorizedException;
import it.evodev.instagram.posts.exception.PostSaveValidationException;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.PostTagProjection;
import it.evodev.instagram.posts.repository.PostTagRepository;
import it.evodev.instagram.posts.service.PostTagService;
import it.evodev.instagram.posts.service.PostVisibilityService;
import it.evodev.instagram.auth.services.AuthSubjectService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Implementazione di PostTagService.
 * 
 * Responsabilità:
 * - Validazione del post e dell'utente autenticato
 * - Delegazione della visibilità a PostVisibilityService
 * - Fetch e ritorno dei tag
 */
@Service
@RequiredArgsConstructor
public class PostTagServiceImpl implements PostTagService {

    private static final Logger logger = LoggerFactory.getLogger(PostTagServiceImpl.class);

    private final PostTagRepository postTagRepository;
    private final PostRepository postRepository;
    private final PostVisibilityService postVisibilityService;
    private final AuthSubjectService authSubjectService;

    @Override
    public List<PostTagDTO> getTagsByPostId(Long postId, String authSubject) {
        if (postId == null || postId <= 0) {
            throw new PostSaveValidationException("Post id must be a positive number");
        }

        UUID currentUserId = authSubjectService.parseUserId(
                authSubject,
                () -> new PostSaveUnauthorizedException("Authentication subject is invalid")
        );

        logger.info("Get tags started - postId: {}, currentUserId: {}", postId, currentUserId);

        // Validate post exists
        if (!postRepository.existsByIdAndDeletedAtIsNull(postId)) {
            logger.warn("Get tags failed - post not found, postId: {}", postId);
            throw new PostSaveNotFoundException("Post not found");
        }

        // Fetch post owner and authenticated user
        Long postOwnerProfileId = postRepository.findProfileIdByPostId(postId)
                .orElseThrow(() -> new PostSaveNotFoundException("Post not found"));

        // Check visibility
        boolean hasAccess = postVisibilityService.canViewPost(currentUserId, postOwnerProfileId);
        
        if (!hasAccess) {
            logger.warn("Get tags denied - access denied, postId: {}, currentUserId: {}", postId, currentUserId);
            return List.of();
        }

        // Fetch and return tags
        List<PostTagDTO> tags = postTagRepository.findTagsByPostId(postId).stream()
                .map(this::toDto)
                .toList();
        logger.info("Get tags completed - postId: {}, currentUserId: {}, tags count: {}", postId, currentUserId, tags.size());

        return tags;
    }

    private PostTagDTO toDto(PostTagProjection projection) {
        return new PostTagDTO(
                projection.getTaggedUsername(),
                projection.getXPosition(),
                projection.getYPosition(),
                projection.getCreatedAt() != null ? projection.getCreatedAt().toString() : null
        );
    }
}
