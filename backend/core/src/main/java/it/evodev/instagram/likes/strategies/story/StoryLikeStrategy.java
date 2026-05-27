package it.evodev.instagram.likes.strategies.story;

import it.evodev.instagram.likes.exceptions.LikeableNotFoundException;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.repositories.LikeRepository;
import it.evodev.instagram.likes.strategies.LikeAccessChecker;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import it.evodev.instagram.stories.repository.StoryReadRepository;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
public class StoryLikeStrategy implements LikeStrategy {

    private final StoryReadRepository storyRepository;
    private final LikeRepository likeRepository;
    private final LikeAccessChecker accessChecker;

    public StoryLikeStrategy(StoryReadRepository storyRepository, LikeRepository likeRepository, LikeAccessChecker accessChecker) {
        this.storyRepository = storyRepository;
        this.likeRepository = likeRepository;
        this.accessChecker = accessChecker;
    }

    @Override
    public LikeableType supportedType() {
        return LikeableType.STORY;
    }

    @Override
    public void validateExists(Long likeableId) {
        if (!storyRepository.existsByIdAndDeletedAtIsNullAndExpiresAtAfter(likeableId, OffsetDateTime.now())) {
            throw new LikeableNotFoundException("Story not found or expired: " + likeableId);
        }
    }

    @Override
    public void validateCanAccess(Long requesterProfileId, Long likeableId) {
        Long ownerProfileId = storyRepository.findProfileIdByStoryId(likeableId).orElse(null);
        if (ownerProfileId != null) {
            accessChecker.enforceAccess(requesterProfileId, ownerProfileId);
        }
    }

    @Override
    public void adjustCount(Long likeableId, int delta) {
        // stories has no denormalized likes_count column — count is always derived
    }

    @Override
    public long getCount(Long likeableId) {
        return likeRepository.countByLikeableTypeAndLikeableIdAndDeletedAtIsNull(LikeableType.STORY, likeableId);
    }

    @Override
    public Long resolveAuthorProfileId(Long likeableId) {
        return storyRepository.findProfileIdByStoryId(likeableId).orElse(null);
    }
}
