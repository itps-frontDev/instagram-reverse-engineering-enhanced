package it.evodev.instagram.reels.services.impl;

import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.reels.dto.responses.ReelFeedResponseDTO;
import it.evodev.instagram.reels.dto.responses.ReelItemDTO;
import it.evodev.instagram.reels.dto.responses.ReelMediaItemDTO;
import it.evodev.instagram.reels.exceptions.ReelNotFoundException;
import it.evodev.instagram.reels.exceptions.ReelUnauthorizedException;
import it.evodev.instagram.reels.models.ReelPostMedia;
import it.evodev.instagram.reels.repositories.ReelPostJpaRepository;
import it.evodev.instagram.reels.repositories.ReelPostMediaJpaRepository;
import it.evodev.instagram.reels.repositories.ReelFeedProjection;
import it.evodev.instagram.reels.services.ReelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReelServiceImpl implements ReelService {

    private final ReelPostJpaRepository reelPostJpaRepository;
    private final ReelPostMediaJpaRepository reelPostMediaJpaRepository;
    private final ProfileJpaRepository profileRepository;

    @Override
    @Transactional(readOnly = true)
    public ReelFeedResponseDTO getReels(UUID userId, int limit, List<Long> excludeIds) {
        log.info("[Reels] getReels start — userId={}, limit={}, excludeIds={}", userId, limit, excludeIds.size());

        if (limit < 1 || limit > 50) {
            throw new ReelUnauthorizedException("Il parametro limit deve essere compreso tra 1 e 50.");
        }

        var profile = profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ReelNotFoundException("Profilo non trovato."));

        List<ReelFeedProjection> projections = reelPostJpaRepository.findReelFeed(
                profile.getId(), limit + 1, excludeIds.toArray(Long[]::new)
        );

        if (projections.isEmpty()) {
            log.info("[Reels] getReels end — no reels found");
            return new ReelFeedResponseDTO(Collections.emptyList(), false);
        }

        boolean hasMore = projections.size() > limit;
        if (hasMore) {
            projections = projections.subList(0, limit);
        }

        List<Long> postIds = projections.stream().map(ReelFeedProjection::getPostId).toList();

        Map<Long, List<ReelPostMedia>> mediaByPostId = reelPostMediaJpaRepository
                .findByPostIdInAndDeletedAtIsNullOrderByPosition(postIds)
                .stream()
                .collect(Collectors.groupingBy(ReelPostMedia::getPostId));

        List<ReelItemDTO> reels = projections.stream()
                .map(p -> toReelItemDTO(p, mediaByPostId.getOrDefault(p.getPostId(), Collections.emptyList())))
                .toList();

        log.info("[Reels] getReels end — returned {} reels, hasMore={}", reels.size(), hasMore);
        return new ReelFeedResponseDTO(reels, hasMore);
    }

    private ReelItemDTO toReelItemDTO(ReelFeedProjection p, List<ReelPostMedia> media) {
        List<ReelMediaItemDTO> mediaDTOs = media.stream()
                .map(m -> new ReelMediaItemDTO(m.getId(), m.getMediaUrl(), m.getMediaType(), m.getDurationSeconds(), m.getPosition()))
                .toList();

        return new ReelItemDTO(
                p.getPostId(),
                p.getProfileId(),
                p.getCaption(),
                p.getLocation(),
                p.getIsCommentsDisabled(),
                p.getIsLikesHidden(),
                p.getLikesCount(),
                p.getCommentsCount(),
                p.getCreatedAt().atOffset(ZoneOffset.UTC),
                p.getProfileUsername(),
                p.getProfileFullName(),
                p.getProfileImageUrl(),
                p.getProfileIsVerified(),
                p.getIsLiked(),
                p.getIsSaved(),
                mediaDTOs
        );
    }
}
