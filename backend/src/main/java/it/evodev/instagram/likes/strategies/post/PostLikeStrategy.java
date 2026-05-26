package it.evodev.instagram.likes.strategies.post;

import it.evodev.instagram.likes.exceptions.LikeableNotFoundException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.strategies.LikeAccessChecker;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import it.evodev.instagram.posts.repository.PostRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PostLikeStrategy implements LikeStrategy {

    private final PostRepository postRepository;
    private final LikeAccessChecker accessChecker;

    public PostLikeStrategy(PostRepository postRepository, LikeAccessChecker accessChecker) {
        this.postRepository = postRepository;
        this.accessChecker = accessChecker;
    }

    @Override
    public LikeableType supportedType() {
        return LikeableType.POST;
    }

    @Override
    public void validateExists(Long likeableId) {
        if (!postRepository.existsByIdAndDeletedAtIsNull(likeableId)) {
            throw new LikeableNotFoundException("Post not found: " + likeableId);
        }
    }

    @Override
    public void validateCanAccess(Long requesterProfileId, Long likeableId) {
        Long ownerProfileId = postRepository.findProfileIdByPostId(likeableId).orElse(null);
        if (ownerProfileId != null) {
            accessChecker.enforceAccess(requesterProfileId, ownerProfileId);
        }
    }

    @Override
    @Transactional
    public void adjustCount(Long likeableId, int delta) {
        postRepository.adjustLikesCount(likeableId, delta);
    }

    @Override
    public long getCount(Long likeableId) {
        return postRepository.findLikesCountByPostId(likeableId).orElse(0L);
    }

    @Override
    public Long resolveAuthorProfileId(Long likeableId) {
        return postRepository.findProfileIdByPostId(likeableId).orElse(null);
    }
}
