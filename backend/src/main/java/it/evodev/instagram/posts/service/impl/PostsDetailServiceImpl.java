package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.repositories.LikeRepository;
import it.evodev.instagram.posts.dto.response.PostDetailDTO;
import it.evodev.instagram.posts.dto.response.PostDetailMediaDTO;
import it.evodev.instagram.posts.exception.PostSaveNotFoundException;
import it.evodev.instagram.posts.exception.PostSaveUnauthorizedException;
import it.evodev.instagram.posts.exception.PostSaveValidationException;
import it.evodev.instagram.posts.model.PostMedia;
import it.evodev.instagram.posts.model.PostSavePost;
import it.evodev.instagram.posts.repository.PostMediaRepository;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.PostSaveSavedPostRepository;
import it.evodev.instagram.posts.repository.PostTagRepository;
import it.evodev.instagram.profile.repository.ProfileByUsernameProjection;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.posts.service.PostVisibilityService;
import it.evodev.instagram.posts.service.PostsDetailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostsDetailServiceImpl implements PostsDetailService {

    private static final Logger logger = LoggerFactory.getLogger(PostsDetailServiceImpl.class);
    private static final int MAX_CAPTION_LENGTH = 2200;

    private final AuthSubjectService authSubjectService;
    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final PostVisibilityService postVisibilityService;
    private final ProfileRepository profileRepository;
    private final LikeRepository likeRepository;
    private final PostSaveSavedPostRepository postSaveSavedPostRepository;
    private final FollowJpaRepository followJpaRepository;
    private final PostTagRepository postTagRepository;
    private final ProfileVisibilityProfileJpaRepository profileVisibilityProfileJpaRepository;

    @Override
    public PostDetailDTO getPostDetail(String authSubject, Long postId) {
        if (postId == null || postId <= 0) {
            throw new PostSaveValidationException("Post ID non valido");
        }

        UUID currentUserId = authSubjectService.parseUserId(authSubject,
            () -> new PostSaveUnauthorizedException("Authentication subject is invalid"));

        PostSavePost post = postRepository.findByIdNotDeleted(postId)
            .orElseThrow(() -> new PostSaveNotFoundException("Post non trovato"));

        // Usiamo il controllo centralizzato di visibilità per evitare bypass su profili privati.
        boolean canView = postVisibilityService.canViewPost(currentUserId, post.getProfileId());
        if (!canView) {
            throw new PostSaveUnauthorizedException("Accesso al post negato");
        }

        Long currentProfileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(currentUserId)
            .orElseThrow(() -> new PostSaveUnauthorizedException("Profilo utente autenticato non trovato"));

        Profile authorProfile = profileRepository.findById(post.getProfileId())
            .orElseThrow(() -> new PostSaveNotFoundException("Profilo autore non trovato"));

        boolean isLikedByCurrentUser = likeRepository
            .findByProfileIdAndLikeableTypeAndLikeableId(currentProfileId, LikeableType.POST, postId)
            .isPresent();

        boolean isSavedByCurrentUser = postSaveSavedPostRepository
            .findTopByProfileIdAndPostIdOrderByCreatedAtDesc(currentProfileId, postId)
            .map(saved -> saved.getDeletedAt() == null)
            .orElse(false);

        boolean isFollowingAuthor = followJpaRepository
            .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                currentProfileId,
                post.getProfileId(),
                "accepted"
            )
            .isPresent();

        boolean hasTags = !postTagRepository.findTagsByPostId(postId).isEmpty();

        ProfileByUsernameProjection authorContext = profileVisibilityProfileJpaRepository
            .findProfileByUsernameWithContext(authorProfile.getUsername(), currentProfileId)
            .orElse(null);

        List<PostDetailMediaDTO> media = postMediaRepository.findByPostIdOrdered(postId).stream()
            .map(this::mapMedia)
            .toList();

        logger.info("Post detail fetched. Post ID: {}, Media count: {}", postId, media.size());
        return new PostDetailDTO(
            post.getId(),
            post.getProfileId(),
            post.getCaption(),
            post.getLikesCount(),
            post.getCommentsCount(),
            post.getCreatedAt(),
            authorProfile.getUsername(),
            authorProfile.getFullName(),
            authorProfile.getProfileImageUrl(),
            authorContext != null && Boolean.TRUE.equals(authorContext.getIsVerified()),
            authorContext != null && Boolean.TRUE.equals(authorContext.getHasActiveStory()),
            authorContext != null && Boolean.TRUE.equals(authorContext.getHasViewedStory()),
            authorProfile.isPrivate(),
            isLikedByCurrentUser,
            isSavedByCurrentUser,
            isFollowingAuthor,
            hasTags,
            media
        );
    }

    private PostDetailMediaDTO mapMedia(PostMedia media) {
        return new PostDetailMediaDTO(
            media.getMediaUrl(),
            media.getMediaType(),
            media.getPosition(),
            media.getDurationSeconds()
        );
    }

    @Override
    @Transactional
    public void deletePost(String authSubject, Long postId) {
        PostSavePost post = validateOwnerAndGetPost(authSubject, postId);
        OffsetDateTime now = OffsetDateTime.now();
        post.setDeletedAt(now);
        postRepository.save(post);
        postMediaRepository.softDeleteByPostId(postId, now);
        profileRepository.decrementPostsCount(post.getProfileId());
        logger.info("Post soft-deleted. Post ID: {}", postId);
    }

    @Override
    @Transactional
    public String updatePostCaption(String authSubject, Long postId, String caption) {
        if (caption == null) {
            throw new PostSaveValidationException("Caption richiesta");
        }
        if (caption.length() > MAX_CAPTION_LENGTH) {
            throw new PostSaveValidationException("Caption troppo lunga (max 2200 caratteri)");
        }

        PostSavePost post = validateOwnerAndGetPost(authSubject, postId);
        post.setCaption(caption);
        postRepository.save(post);
        logger.info("Post caption updated. Post ID: {}", postId);
        return caption;
    }

    private PostSavePost validateOwnerAndGetPost(String authSubject, Long postId) {
        if (postId == null || postId <= 0) {
            throw new PostSaveValidationException("Post ID non valido");
        }

        UUID currentUserId = authSubjectService.parseUserId(authSubject,
            () -> new PostSaveUnauthorizedException("Authentication subject is invalid"));

        Long currentProfileId = profileRepository.findIdByUserIdAndDeletedAtIsNull(currentUserId)
            .orElseThrow(() -> new PostSaveUnauthorizedException("Profilo utente autenticato non trovato"));

        PostSavePost post = postRepository.findByIdNotDeleted(postId)
            .orElseThrow(() -> new PostSaveNotFoundException("Post non trovato"));

        if (!post.getProfileId().equals(currentProfileId)) {
            throw new PostSaveUnauthorizedException("Post non trovato o accesso negato");
        }

        return post;
    }
}
