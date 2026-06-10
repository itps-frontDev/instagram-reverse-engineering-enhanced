package it.evodev.instagram.comments.service.impl;

import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.comments.dto.request.CommentCreateRequestDTO;
import it.evodev.instagram.comments.dto.response.CommentDataDTO;
import it.evodev.instagram.comments.dto.response.CommentListDataDTO;
import it.evodev.instagram.comments.events.CommentCreatedEvent;
import it.evodev.instagram.comments.events.CommentDeletedEvent;
import it.evodev.instagram.comments.exception.CommentForbiddenException;
import it.evodev.instagram.comments.exception.CommentNotFoundException;
import it.evodev.instagram.comments.exception.CommentUnauthorizedException;
import it.evodev.instagram.comments.exception.CommentValidationException;
import it.evodev.instagram.comments.model.Comment;
import it.evodev.instagram.comments.repository.CommentRepository;
import it.evodev.instagram.comments.repository.CommentRepository.CommentFeedProjection;
import it.evodev.instagram.comments.repository.CommentRepository.CommentOwnershipProjection;
import it.evodev.instagram.comments.repository.CommentRepository.CommentPostAccessProjection;
import it.evodev.instagram.comments.service.CommentsService;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentsServiceImpl implements CommentsService {

    private static final Logger logger = LoggerFactory.getLogger(CommentsServiceImpl.class);

    private final CommentRepository commentRepository;
    private final ProfileJpaRepository profileRepository;
    private final AuthSubjectService authSubjectService;
    private final ProfileVisibilityService profileVisibilityService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public CommentListDataDTO listComments(String authSubject, Long postId, Integer limit, Integer offset) {
        UUID currentUserId = parseAuthSubject(authSubject);
        Long currentProfileId = resolveCurrentProfileId(currentUserId);
        long requestedPostId = requirePositive(postId, "Post id must be a positive number");
        int resolvedLimit = normalizeLimit(limit);
        int resolvedOffset = normalizeOffset(offset);

        CommentPostAccessProjection post = commentRepository.findPostAccessById(requestedPostId)
                .orElseThrow(() -> new CommentNotFoundException("Post not found"));

        assertCanAccessPost(currentUserId, post.getProfileUsername());

        logger.info("Listing comments started - currentProfileId: {}, postId: {}, limit: {}, offset: {}",
                currentProfileId, requestedPostId, resolvedLimit, resolvedOffset);

        List<CommentFeedProjection> rows = commentRepository.findCommentsForPost(
                requestedPostId,
                currentProfileId,
                resolvedLimit + 1,
                resolvedOffset
        );

        boolean hasMore = rows.size() > resolvedLimit;
        List<CommentDataDTO> comments = rows.stream()
                .limit(resolvedLimit)
                .map(this::toDto)
                .toList();

        CommentListDataDTO response = new CommentListDataDTO(comments, safeLong(post.getCommentsCount()), hasMore);
        logger.info("Listing comments completed - currentProfileId: {}, postId: {}, count: {}, hasMore: {}",
                currentProfileId, requestedPostId, comments.size(), hasMore);
        return response;
    }

    @Override
    @Transactional
    public CommentDataDTO createComment(String authSubject, CommentCreateRequestDTO request) {
        UUID currentUserId = parseAuthSubject(authSubject);
        Long currentProfileId = resolveCurrentProfileId(currentUserId);
        long postId = requirePositive(request.postId(), "Post id must be a positive number");
        String text = normalizeText(request.text());
        Long parentId = request.parentId();
        if (parentId != null && parentId <= 0) {
            throw new CommentValidationException("Parent comment id must be a positive number");
        }

        CommentPostAccessProjection post = commentRepository.findPostAccessById(postId)
                .orElseThrow(() -> new CommentNotFoundException("Post not found"));

        assertCanAccessPost(currentUserId, post.getProfileUsername());

        if (Boolean.TRUE.equals(post.getCommentsDisabled())) {
            throw new CommentForbiddenException("Comments are disabled for this post");
        }

        if (parentId != null && !commentRepository.existsByIdAndPostIdAndDeletedAtIsNull(parentId, postId)) {
            throw new CommentNotFoundException("Comment parent not found");
        }

        logger.info("Creating comment started - currentProfileId: {}, postId: {}, parentId: {}",
                currentProfileId, postId, parentId);

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setProfileId(currentProfileId);
        comment.setParentId(parentId);
        comment.setText(text);
        comment.setLikesCount(0);
        Comment saved = commentRepository.saveAndFlush(comment);

        if (parentId == null) {
            commentRepository.adjustPostCommentsCount(postId, 1L);
        }

        CommentDataDTO response = commentRepository.findCommentForViewer(saved.getId(), currentProfileId)
                .map(this::toDto)
                .orElseThrow(() -> new CommentNotFoundException("Comment not found after creation"));

        publishCommentCreatedEvent(saved.getId(), post, parentId, currentProfileId);

        logger.info("Creating comment completed - currentProfileId: {}, postId: {}, commentId: {}",
                currentProfileId, postId, saved.getId());
        return response;
    }

    @Override
    @Transactional
    public void deleteComment(String authSubject, Long commentId) {
        Long currentProfileId = resolveCurrentProfileId(parseAuthSubject(authSubject));
        long resolvedCommentId = requirePositive(commentId, "Comment id must be a positive number");

        CommentOwnershipProjection ownership = commentRepository.findOwnershipById(resolvedCommentId)
                .orElseThrow(() -> new CommentNotFoundException("Comment not found"));

        boolean canDelete = ownership.getProfileId().equals(currentProfileId)
                || ownership.getPostOwnerProfileId().equals(currentProfileId);

        if (!canDelete) {
            throw new CommentForbiddenException("You cannot delete this comment");
        }

        logger.info("Deleting comment started - currentProfileId: {}, commentId: {}, postId: {}",
                currentProfileId, resolvedCommentId, ownership.getPostId());

        int updated = commentRepository.softDeleteById(resolvedCommentId);
        if (updated == 0) {
            throw new CommentNotFoundException("Comment not found");
        }

        if (ownership.getParentId() == null) {
            commentRepository.adjustPostCommentsCount(ownership.getPostId(), -1L);
        }

        publishCommentDeletedEvent(resolvedCommentId, ownership, currentProfileId);

        logger.info("Deleting comment completed - currentProfileId: {}, commentId: {}", currentProfileId, resolvedCommentId);
    }

    private void assertCanAccessPost(UUID currentUserId, String targetUsername) {
        try {
            if (!profileVisibilityService.canViewProfile(currentUserId, targetUsername).isCanView()) {
                throw new CommentForbiddenException("You cannot comment on this post");
            }
        } catch (ProfileNotFoundException exception) {
            throw new CommentNotFoundException("Post not found");
        }
    }

    private void publishCommentCreatedEvent(Long commentId, CommentPostAccessProjection post, Long parentId, Long senderProfileId) {
        Long recipientProfileId = parentId == null
                ? post.getProfileId()
                : commentRepository.findAuthorProfileIdById(parentId).orElse(null);

        if (recipientProfileId == null || recipientProfileId.equals(senderProfileId)) {
            return;
        }

        eventPublisher.publishEvent(new CommentCreatedEvent(commentId, senderProfileId, recipientProfileId, parentId));
    }

    private void publishCommentDeletedEvent(Long commentId, CommentOwnershipProjection ownership, Long deleterProfileId) {
        Long senderProfileId = ownership.getProfileId();
        Long parentId = ownership.getParentId();

        Long recipientProfileId = parentId == null
                ? ownership.getPostOwnerProfileId()
                : commentRepository.findAuthorProfileIdById(parentId).orElse(null);

        if (recipientProfileId == null || senderProfileId.equals(recipientProfileId)) {
            return;
        }

        eventPublisher.publishEvent(new CommentDeletedEvent(commentId, senderProfileId, recipientProfileId, parentId));
    }

    private CommentDataDTO toDto(CommentFeedProjection projection) {
        return CommentDataDTO.from(
                projection.getId(),
                projection.getPostId(),
                projection.getProfileId(),
                projection.getParentId(),
                projection.getText(),
                safeLong(projection.getLikesCount()),
                projection.getCreatedAt(),
                projection.getProfileUsername(),
                projection.getProfileFullName(),
                projection.getProfileImageUrl(),
                Boolean.TRUE.equals(projection.getProfileIsVerified()),
                Boolean.TRUE.equals(projection.getProfileHasActiveStory()),
                Boolean.TRUE.equals(projection.getProfileHasViewedStory()),
                Boolean.TRUE.equals(projection.getProfileIsPrivate()),
                Boolean.TRUE.equals(projection.getIsLikedByCurrentUser())
        );
    }

    private UUID parseAuthSubject(String authSubject) {
        return authSubjectService.parseUserId(authSubject, () -> new CommentUnauthorizedException("Authentication subject is invalid"));
    }

    private Long resolveCurrentProfileId(UUID authSubjectUuid) {
        return profileRepository.findIdByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .orElseThrow(() -> new CommentUnauthorizedException("Authenticated profile not found"));
    }

    private long requirePositive(Long value, String message) {
        if (value == null || value <= 0) {
            throw new CommentValidationException(message);
        }
        return value;
    }

    private String normalizeText(String text) {
        if (text == null) {
            throw new CommentValidationException("Comment text is required");
        }

        String normalized = text.trim();
        if (normalized.isEmpty()) {
            throw new CommentValidationException("Comment text is required");
        }
        if (normalized.length() > 2200) {
            throw new CommentValidationException("Comment text must be 2200 characters or less");
        }
        return normalized;
    }

    private int normalizeLimit(Integer limit) {
        int defaultLimit = 20;
        int requestedLimit = limit == null ? defaultLimit : limit;
        if (requestedLimit <= 0) {
            throw new CommentValidationException("Limit must be greater than zero");
        }
        return Math.min(requestedLimit, 100);
    }

    private int normalizeOffset(Integer offset) {
        int requestedOffset = offset == null ? 0 : offset;
        if (requestedOffset < 0) {
            throw new CommentValidationException("Offset cannot be negative");
        }
        return requestedOffset;
    }

    private long safeLong(Number value) {
        return value == null ? 0L : value.longValue();
    }
}
