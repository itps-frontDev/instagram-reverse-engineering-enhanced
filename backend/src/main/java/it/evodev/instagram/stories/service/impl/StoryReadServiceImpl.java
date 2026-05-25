package it.evodev.instagram.stories.service.impl;

import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import it.evodev.instagram.profile.models.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import it.evodev.instagram.stories.dto.response.StoryCollectionDataDTO;
import it.evodev.instagram.stories.dto.response.StoryItemDTO;
import it.evodev.instagram.stories.exception.read.StoryNotFoundOrNotAccessibleException;
import it.evodev.instagram.stories.exception.read.StoryReadValidationException;
import it.evodev.instagram.stories.repository.StoryReadProjection;
import it.evodev.instagram.stories.repository.StoryReadRepository;
import it.evodev.instagram.stories.service.StoryReadService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoryReadServiceImpl implements StoryReadService {

    private static final Logger logger = LoggerFactory.getLogger(StoryReadServiceImpl.class);

    private final ProfileVisibilityProfileJpaRepository profileRepository;
    private final ProfileVisibilityService profileVisibilityService;
    private final StoryReadRepository storyReadRepository;

    @Override
    public StoryCollectionDataDTO getActiveStories(UUID currentUserId) {
        logger.info("Fetching active stories for user: {}", currentUserId);

        Long viewerProfileId = resolveViewerProfileId(currentUserId);
        List<StoryItemDTO> stories = storyReadRepository.findActiveStoriesForViewer(viewerProfileId)
                .stream()
                .map(this::toDto)
                .toList();

        logger.info("Active stories fetched for user: {} - count: {}", currentUserId, stories.size());
        return new StoryCollectionDataDTO(stories);
    }

    @Override
    public StoryCollectionDataDTO getStoriesByProfile(UUID currentUserId, Long profileId) {
        logger.info("Fetching stories by profile. User: {}, ProfileId: {}", currentUserId, profileId);

        if (profileId == null || profileId <= 0) {
            throw new StoryReadValidationException("Profile id must be a positive number.");
        }

        Long viewerProfileId = resolveViewerProfileId(currentUserId);
        ProfileVisibilityProfile targetProfile = profileRepository.findById(profileId)
                .filter(profile -> profile.getDeletedAt() == null)
                .orElseThrow(() -> new StoryNotFoundOrNotAccessibleException("Story not found or not accessible."));

        if (!profileVisibilityService.canViewProfile(currentUserId, targetProfile.getUsername()).isCanView()) {
            logger.warn("Story access denied. Viewer profile: {}, Target profile: {}", viewerProfileId, profileId);
            throw new StoryNotFoundOrNotAccessibleException("Story not found or not accessible.");
        }

        List<StoryItemDTO> stories = storyReadRepository.findActiveStoriesByProfileId(profileId, viewerProfileId)
                .stream()
                .map(this::toDto)
                .toList();

        logger.info("Stories fetched by profile. User: {}, ProfileId: {}, count: {}", currentUserId, profileId, stories.size());
        return new StoryCollectionDataDTO(stories);
    }

    private Long resolveViewerProfileId(UUID currentUserId) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .map(ProfileVisibilityProfile::getId)
                .orElseThrow(() -> new StoryReadValidationException("Authenticated profile not found."));
    }


    private StoryItemDTO toDto(StoryReadProjection projection) {
        return new StoryItemDTO(
                projection.getId(),
                projection.getProfileId(),
                projection.getUsername(),
                projection.getProfileImageUrl(),
                Boolean.TRUE.equals(projection.getIsVerified()),
                projection.getMediaUrl(),
                projection.getMediaType(),
                projection.getDurationSeconds(),
                projection.getViewsCount(),
                projection.getCreatedAt(),
                projection.getExpiresAt(),
                Boolean.TRUE.equals(projection.getIsLikedByMe()),
                Boolean.TRUE.equals(projection.getIsViewed())
        );
    }
}
