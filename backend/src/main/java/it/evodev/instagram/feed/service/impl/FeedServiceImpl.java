package it.evodev.instagram.feed.service.impl;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.auth.services.AuthSubjectService;
import it.evodev.instagram.common.service.AbstractPostFeedService;
import it.evodev.instagram.common.util.PaginationParamNormalizer;
import it.evodev.instagram.feed.dto.request.FeedRequestDTO;
import it.evodev.instagram.feed.dto.response.FeedDataDTO;
import it.evodev.instagram.feed.dto.response.FeedMediaDTO;
import it.evodev.instagram.feed.dto.response.FeedPostDTO;
import it.evodev.instagram.feed.exception.FeedException;
import it.evodev.instagram.feed.exception.FeedUnauthorizedException;
import it.evodev.instagram.feed.exception.FeedValidationException;
import it.evodev.instagram.feed.repository.FeedMediaProjection;
import it.evodev.instagram.feed.repository.FeedPostProjection;
import it.evodev.instagram.feed.repository.FeedRepository;
import it.evodev.instagram.feed.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedServiceImpl extends AbstractPostFeedService implements FeedService {

    private static final Logger logger = LoggerFactory.getLogger(FeedServiceImpl.class);
    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final FeedRepository feedRepository;
    private final ProfileRepository profileRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    public FeedDataDTO getFeed(String authSubject, FeedRequestDTO request) {
        logger.info("Feed service started");

        UUID userId = parseUserId(
                authSubjectService,
                authSubject,
                () -> new FeedUnauthorizedException("Authentication subject is invalid")
        );
        Profile currentProfile = resolveCurrentProfile(
                profileRepository,
                userId,
                () -> new FeedUnauthorizedException("Authenticated profile not found")
        );

        int limit = PaginationParamNormalizer.normalizeLimit(
                request.getLimit(),
                DEFAULT_LIMIT,
                MAX_LIMIT,
                () -> new FeedValidationException("Query parameter limit must be between 1 and 50")
        );
        int offset = PaginationParamNormalizer.normalizeOffset(
                request.getOffset(),
                () -> new FeedValidationException("Query parameter offset must be >= 0")
        );

        // Carichiamo limit+1 record per capire se esiste una pagina successiva senza query COUNT costose.
        List<FeedPostProjection> rawPosts = fetchWithPersistenceGuard(
                () -> feedRepository.findFeedPosts(currentProfile.getId(), limit + 1, offset),
                () -> new FeedException("FEED_INTERNAL_ERROR", "Feed temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR),
                logger,
                "Feed posts query failed."
        );

        PageSlice<FeedPostProjection> page = slicePage(rawPosts, limit, offset);
        List<Long> postIds = page.items().stream().map(FeedPostProjection::getId).toList();

        Map<Long, List<FeedMediaDTO>> mediaByPostId = loadMedia(postIds);
        List<FeedPostDTO> posts = page.items().stream()
                .map(post -> toPostDto(post, mediaByPostId.getOrDefault(post.getId(), List.of())))
                .toList();

        logger.info("Feed service completed with posts: {}, hasMore: {}", posts.size(), page.hasMore());
        return new FeedDataDTO(posts, page.nextCursor(), page.hasMore());
    }

    private Map<Long, List<FeedMediaDTO>> loadMedia(List<Long> postIds) {
        return loadMediaMap(
                postIds,
                () -> feedRepository.findMediaByPostIds(postIds),
                FeedMediaProjection::getPostId,
                row -> new FeedMediaDTO(
                        row.getId(),
                        row.getPostId(),
                        row.getMediaUrl(),
                        row.getMediaType(),
                        row.getDurationSeconds(),
                        row.getPosition() != null ? row.getPosition() : 0
                ),
                () -> new FeedException("FEED_INTERNAL_ERROR", "Feed temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR),
                logger,
                "Feed media query failed."
        );
    }

    private FeedPostDTO toPostDto(FeedPostProjection row, List<FeedMediaDTO> media) {
        return new FeedPostDTO(
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
                Boolean.TRUE.equals(row.getProfileHasViewedStory()),
                Boolean.TRUE.equals(row.getProfilePrivate()),
                media,
                Boolean.TRUE.equals(row.getLikedByCurrentUser()),
                Boolean.TRUE.equals(row.getSavedByCurrentUser()),
                Boolean.TRUE.equals(row.getFollowingAuthor()),
                Boolean.TRUE.equals(row.getHasTags())
        );
    }

}
