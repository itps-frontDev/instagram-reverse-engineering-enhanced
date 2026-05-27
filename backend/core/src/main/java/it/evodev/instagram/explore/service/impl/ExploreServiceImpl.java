package it.evodev.instagram.explore.service.impl;

import it.evodev.instagram.profile.models.Profile;
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
import it.evodev.instagram.common.service.AbstractPostFeedService;
import it.evodev.instagram.common.util.PaginationParamNormalizer;
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
public class ExploreServiceImpl extends AbstractPostFeedService implements ExploreService {

    private static final Logger logger = LoggerFactory.getLogger(ExploreServiceImpl.class);
    private static final int DEFAULT_LIMIT = 30;
    private static final int MAX_LIMIT = 60;

    private final ExploreRepository exploreRepository;
    private final ProfileRepository profileRepository;
    private final AuthSubjectService authSubjectService;

    @Override
    public ExploreFeedDataDTO getExplore(String authSubject, ExploreRequestDTO request) {
        logger.info("Explore service started");

        UUID userId = parseUserId(
                authSubjectService,
                authSubject,
                () -> new ExploreUnauthorizedException("Authentication subject is invalid")
        );
        Profile currentProfile = resolveCurrentProfile(
                profileRepository,
                userId,
                () -> new ExploreUnauthorizedException("Authenticated profile not found")
        );

        int limit = PaginationParamNormalizer.normalizeLimit(
                request.getLimit(),
                DEFAULT_LIMIT,
                MAX_LIMIT,
                () -> new ExploreValidationException("Query parameter limit must be between 1 and 60")
        );
        int offset = PaginationParamNormalizer.normalizeOffset(
                request.getOffset(),
                () -> new ExploreValidationException("Query parameter offset must be >= 0")
        );

        // Carichiamo limit+1 record per capire se esiste una pagina successiva senza query COUNT costose.
        List<ExplorePostProjection> rawPosts = fetchWithPersistenceGuard(
                () -> exploreRepository.findExplorePosts(currentProfile.getId(), limit + 1, offset),
                () -> new ExploreException("EXPLORE_INTERNAL_ERROR", "Explore temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR),
                logger,
                "Explore posts query failed."
        );

        PageSlice<ExplorePostProjection> page = slicePage(rawPosts, limit, offset);
        List<Long> postIds = page.items().stream().map(ExplorePostProjection::getId).toList();

        Map<Long, List<ExploreMediaDTO>> mediaByPostId = loadMedia(postIds);
        List<ExplorePostDTO> posts = page.items().stream()
                .map(post -> toPostDto(post, mediaByPostId.getOrDefault(post.getId(), List.of())))
                .toList();

        logger.info("Explore service completed with posts: {}, hasMore: {}", posts.size(), page.hasMore());
        return new ExploreFeedDataDTO(posts, page.nextCursor(), page.hasMore());
    }

    private Map<Long, List<ExploreMediaDTO>> loadMedia(List<Long> postIds) {
        return loadMediaMap(
                postIds,
                () -> exploreRepository.findMediaByPostIds(postIds),
                ExploreMediaProjection::getPostId,
                row -> new ExploreMediaDTO(
                        row.getId(),
                        row.getPostId(),
                        row.getMediaUrl(),
                        row.getMediaType(),
                        row.getDurationSeconds(),
                        row.getPosition() != null ? row.getPosition() : 0
                ),
                () -> new ExploreException("EXPLORE_INTERNAL_ERROR", "Explore temporarily unavailable", HttpStatus.INTERNAL_SERVER_ERROR),
                logger,
                "Explore media query failed."
        );
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

}
