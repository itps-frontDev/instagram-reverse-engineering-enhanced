package it.evodev.instagram.likes.services.impl;

import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.likes.dto.responses.LikeToggleResponseDTO;
import it.evodev.instagram.likes.events.LikeCreatedEvent;
import it.evodev.instagram.likes.events.LikeRemovedEvent;
import it.evodev.instagram.likes.exceptions.LikeValidationException;
import it.evodev.instagram.likes.models.Like;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.repositories.LikeRepository;
import it.evodev.instagram.likes.services.LikeService;
import it.evodev.instagram.likes.strategies.LikeStrategy;
import it.evodev.instagram.likes.strategies.LikeStrategyRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LikeServiceImpl implements LikeService {

    private static final Logger logger = LoggerFactory.getLogger(LikeServiceImpl.class);

    private final LikeRepository likeRepository;
    private final LikeStrategyRegistry strategyRegistry;
    private final ApplicationEventPublisher eventPublisher;
    private final ProfileRepository profileRepository;

    @Override
    @Transactional
    public LikeToggleResponseDTO toggle(UUID authSubjectUuid, LikeableType type, Long likeableId) {
        Long profileId = profileRepository
                .findIdByUserIdAndDeletedAtIsNull(authSubjectUuid)
                .orElseThrow(() -> new LikeValidationException("Authenticated profile not found"));

        logger.info("Toggle like started - profileId: {}, type: {}, likeableId: {}", profileId, type, likeableId);

        LikeStrategy strategy = strategyRegistry.resolve(type);
        strategy.validateExists(likeableId);

        Optional<Like> existing = likeRepository.findByProfileIdAndLikeableTypeAndLikeableId(profileId, type, likeableId);

        boolean liked;
        if (existing.isPresent() && existing.get().getDeletedAt() == null) {
            Like like = existing.get();
            like.setDeletedAt(OffsetDateTime.now());
            likeRepository.save(like);
            strategy.adjustCount(likeableId, -1);
            liked = false;
            publishLikeRemovedEvent(profileId, type, likeableId, strategy);
            logger.info("Toggle like completed (unlike) - profileId: {}, type: {}, likeableId: {}", profileId, type, likeableId);
        } else if (existing.isPresent()) {
            Like like = existing.get();
            like.setDeletedAt(null);
            likeRepository.save(like);
            strategy.adjustCount(likeableId, 1);
            liked = true;
            publishLikeCreatedEvent(profileId, type, likeableId, strategy);
            logger.info("Toggle like completed (re-like) - profileId: {}, type: {}, likeableId: {}", profileId, type, likeableId);
        } else {
            Like like = new Like();
            like.setProfileId(profileId);
            like.setLikeableType(type);
            like.setLikeableId(likeableId);
            likeRepository.save(like);
            strategy.adjustCount(likeableId, 1);
            liked = true;
            publishLikeCreatedEvent(profileId, type, likeableId, strategy);
            logger.info("Toggle like completed (new like) - profileId: {}, type: {}, likeableId: {}", profileId, type, likeableId);
        }

        long count = strategy.getCount(likeableId);
        return new LikeToggleResponseDTO(true, liked, count);
    }

    private void publishLikeCreatedEvent(Long senderProfileId, LikeableType type, Long likeableId, LikeStrategy strategy) {
        Long authorProfileId = strategy.resolveAuthorProfileId(likeableId);
        if (authorProfileId == null || authorProfileId.equals(senderProfileId)) {
            logger.info("Like event skipped (self-like) - profileId: {}, type: {}, likeableId: {}", senderProfileId, type, likeableId);
            return;
        }
        eventPublisher.publishEvent(new LikeCreatedEvent(senderProfileId, authorProfileId, type, likeableId));
    }

    private void publishLikeRemovedEvent(Long senderProfileId, LikeableType type, Long likeableId, LikeStrategy strategy) {
        Long authorProfileId = strategy.resolveAuthorProfileId(likeableId);
        if (authorProfileId == null || authorProfileId.equals(senderProfileId)) {
            logger.info("Like removed event skipped (self-like) - profileId: {}, type: {}, likeableId: {}", senderProfileId, type, likeableId);
            return;
        }
        eventPublisher.publishEvent(new LikeRemovedEvent(senderProfileId, authorProfileId, type, likeableId));
    }
}
