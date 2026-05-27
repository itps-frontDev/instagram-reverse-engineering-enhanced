package it.evodev.instagram.likes.strategies.comment;

import it.evodev.instagram.comments.repository.CommentRepository;
import it.evodev.instagram.likes.exceptions.LikeableNotFoundException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.strategies.LikeAccessChecker;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentLikeStrategy implements LikeStrategy {

    private final CommentRepository commentRepository;
    private final LikeAccessChecker accessChecker;

    @Override
    public LikeableType supportedType() {
        return LikeableType.COMMENT;
    }

    @Override
    public void validateExists(Long likeableId) {
        if (!commentRepository.existsByIdAndDeletedAtIsNull(likeableId)) {
            throw new LikeableNotFoundException("Comment not found: " + likeableId);
        }
    }

    @Override
    public void validateCanAccess(Long requesterProfileId, Long likeableId) {
        commentRepository.findOwnershipById(likeableId).ifPresent(ownership ->
                accessChecker.enforceAccess(requesterProfileId, ownership.getPostOwnerProfileId()));
    }

    @Override
    public void adjustCount(Long likeableId, int delta) {
        commentRepository.adjustLikesCount(likeableId, delta);
    }

    @Override
    public long getCount(Long likeableId) {
        return commentRepository.findLikesCountById(likeableId).orElse(0L);
    }

    @Override
    public Long resolveAuthorProfileId(Long likeableId) {
        return commentRepository.findAuthorProfileIdById(likeableId).orElse(null);
    }
}
