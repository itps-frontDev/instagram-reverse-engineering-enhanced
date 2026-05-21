package it.evodev.instagram.explore.service.impl;

import it.evodev.instagram.auth.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.explore.dto.request.ExploreRequestDTO;
import it.evodev.instagram.explore.dto.response.ExploreFeedDataDTO;
import it.evodev.instagram.explore.dto.response.ExploreMediaDTO;
import it.evodev.instagram.explore.dto.response.ExplorePostDTO;
import it.evodev.instagram.explore.exception.ExploreException;
import it.evodev.instagram.explore.exception.ExploreUnauthorizedException;
import it.evodev.instagram.explore.exception.ExploreValidationException;
import it.evodev.instagram.explore.repository.ExploreMediaProjection;
import it.evodev.instagram.explore.repository.ExplorePostProjection;
import it.evodev.instagram.explore.repository.ExploreRepository;
import it.evodev.instagram.explore.service.ExploreService;
import jakarta.persistence.PersistenceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExploreServiceImpl implements ExploreService {

    private static final Logger logger = LoggerFactory.getLogger(ExploreServiceImpl.class);
    private static final int DEFAULT_LIMIT = 30;
    private static final int MAX_LIMIT = 60;

    private final ExploreRepository exploreRepository;
    private final ProfileRepository profileRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    public ExploreFeedDataDTO getExplore(String authSubject, ExploreRequestDTO request) {
        logger.info("Explore service started");

        UUID userId = authSubjectService.parseUserId(
                authSubject,
                () -> new ExploreUnauthorizedException("Authentication subject is invalid")
        );
        Profile currentProfile = profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ExploreUnauthorizedException("Authenticated profile not found"));

        int limit = normalizeLimit(request.getLimit());
        int offset = normalizeOffset(request.getOffset());

        List<ExplorePostProjection> rawPosts;
        try {
            // Carichiamo limit+1 record per capire se esiste una pagina successiva senza query COUNT costose.
            rawPosts = exploreRepository.findExplorePosts(currentProfile.getId(), limit + 1, offset);
        } catch (PersistenceException exception) {
            logger.error("Explore posts query failed. Error: {}", exception.getMessage());
            throw new ExploreException("EXPLORE_INTERNAL_ERROR", "Explore temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        boolean hasMore = rawPosts.size() > limit;
        List<ExplorePostProjection> pagePosts = hasMore ? rawPosts.subList(0, limit) : rawPosts;
        List<Long> postIds = pagePosts.stream().map(ExplorePostProjection::getId).toList();

        Map<Long, List<ExploreMediaDTO>> mediaByPostId = loadMedia(postIds);
        List<ExplorePostDTO> posts = pagePosts.stream()
                .map(post -> toPostDto(post, mediaByPostId.getOrDefault(post.getId(), List.of())))
                .toList();

        String nextCursor = hasMore ? String.valueOf(offset + posts.size()) : null;
        logger.info("Explore service completed with posts: {}, hasMore: {}", posts.size(), hasMore);
        return new ExploreFeedDataDTO(posts, nextCursor, hasMore);
    }

    private Map<Long, List<ExploreMediaDTO>> loadMedia(List<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }

        List<ExploreMediaProjection> mediaRows;
        try {
            mediaRows = exploreRepository.findMediaByPostIds(postIds);
        } catch (PersistenceException exception) {
            logger.error("Explore media query failed. Error: {}", exception.getMessage());
            throw new ExploreException("EXPLORE_INTERNAL_ERROR", "Explore temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Map<Long, List<ExploreMediaDTO>> mediaByPostId = new HashMap<>();
        for (ExploreMediaProjection row : mediaRows) {
            ExploreMediaDTO dto = new ExploreMediaDTO(
                    row.getId(),
                    row.getPostId(),
                    row.getMediaUrl(),
                    row.getMediaType(),
                    row.getDurationSeconds(),
                    row.getPosition() != null ? row.getPosition() : 0
            );
            mediaByPostId.computeIfAbsent(row.getPostId(), ignored -> new ArrayList<>()).add(dto);
        }
        return mediaByPostId;
    }

    private ExplorePostDTO toPostDto(ExplorePostProjection row, List<ExploreMediaDTO> media) {
        return new ExplorePostDTO(
                row.getId(),
                row.getProfileId(),
                row.getCaption(),
                row.getLocation(),
                Boolean.TRUE.equals(row.getCommentsDisabled()),
                Boolean.TRUE.equals(row.getLikesHidden()),
                row.getLikesCount() != null ? row.getLikesCount() : 0,
                row.getCommentsCount() != null ? row.getCommentsCount() : 0,
                row.getCreatedAt() != null ? row.getCreatedAt().toString() : null,
                row.getProfileUsername(),
                row.getProfileFullName(),
                row.getProfileImageUrl(),
                Boolean.TRUE.equals(row.getProfileVerified()),
                Boolean.TRUE.equals(row.getProfileHasActiveStory()),
                false,
                Boolean.TRUE.equals(row.getProfilePrivate()),
                media,
                Boolean.TRUE.equals(row.getLikedByCurrentUser()),
                Boolean.TRUE.equals(row.getSavedByCurrentUser()),
                Boolean.TRUE.equals(row.getFollowingAuthor()),
                Boolean.TRUE.equals(row.getHasTags())
        );
    }

    private static int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        if (limit < 1 || limit > MAX_LIMIT) {
            throw new ExploreValidationException("Query parameter limit must be between 1 and 60");
        }
        return limit;
    }

    private static int normalizeOffset(Integer offset) {
        if (offset == null) {
            return 0;
        }
        if (offset < 0) {
            throw new ExploreValidationException("Query parameter offset must be >= 0");
        }
        return offset;
    }
}
