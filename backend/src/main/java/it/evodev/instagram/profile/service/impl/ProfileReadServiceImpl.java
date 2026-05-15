package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileFollowerDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;
import it.evodev.instagram.profile.dto.response.RecentPostPreviewDto;
import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;
import it.evodev.instagram.profile.exception.ProfileForbiddenException;
import it.evodev.instagram.profile.exception.ProfileNotFoundException;
import it.evodev.instagram.profile.model.ProfileVisibilityFollow;
import it.evodev.instagram.profile.model.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileByUsernameProjection;
import it.evodev.instagram.profile.repository.ProfileFollowerProjection;
import it.evodev.instagram.profile.repository.ProfileVisibilityFollowJpaRepository;
import it.evodev.instagram.profile.repository.ProfilePreviewProjection;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.FollowService;
import it.evodev.instagram.profile.service.ProfileReadService;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileReadServiceImpl implements ProfileReadService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileReadServiceImpl.class);

    private final ProfileVisibilityProfileJpaRepository profileRepository;
    private final ProfileVisibilityFollowJpaRepository followRepository;
    private final ProfileVisibilityService profileVisibilityService;
    private final FollowService followService;

    @Override
    public ProfileByUsernameDataDTO getProfileByUsername(UUID currentUserId, String targetUsername) {
        logger.info("Fetching profile by username. Current user: {}, Target username: {}", currentUserId, targetUsername);

        Optional<ProfileVisibilityProfile> currentProfileOpt = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId);
        if (currentProfileOpt.isEmpty()) {
            logger.warn("Current user profile not found. User ID: {}", currentUserId);
            throw new ProfileNotFoundException("User profile not found");
        }

        Long viewerProfileId = currentProfileOpt.get().getId();

        Optional<ProfileByUsernameProjection> projectionOpt =
                profileRepository.findProfileByUsernameWithContext(targetUsername, viewerProfileId);

        if (projectionOpt.isEmpty()) {
            logger.warn("Target profile not found. Username: {}", targetUsername);
            throw new ProfileNotFoundException("Profile not found");
        }

        ProfileByUsernameProjection projection = projectionOpt.get();
        ProfileVisibilityDataDTO visibilityData = profileVisibilityService.canViewProfile(currentUserId, targetUsername);
        FollowStatusDataDTO followStatusData = followService.getFollowStatus(currentUserId, targetUsername);

        boolean canView = visibilityData.isCanView();
        String followStatus = followStatusData.getStatus();
        boolean isOwner = "self".equalsIgnoreCase(followStatus);

        if (!canView) {
            logger.info("Returning partial profile payload. Username: {}, Follow status: {}", targetUsername, followStatus);
            return ProfileByUsernameDataDTO.builder()
                    .id(projection.getId())
                    .userId(projection.getUserId())
                    .username(projection.getUsername())
                    .profileImageUrl(projection.getProfileImageUrl())
                    .bio(projection.getBio())
                    .privateProfile(Boolean.TRUE.equals(projection.getIsPrivate()))
                    .followersCount(defaultInt(projection.getFollowersCount()))
                    .followingCount(defaultInt(projection.getFollowingCount()))
                    .postsCount(defaultInt(projection.getPostsCount()))
                    .owner(isOwner)
                    .canView(false)
                    .followStatus(followStatus)
                    .build();
        }

        logger.info("Returning full profile payload. Username: {}, Follow status: {}", targetUsername, followStatus);
        return ProfileByUsernameDataDTO.builder()
                .id(projection.getId())
                .userId(projection.getUserId())
                .username(projection.getUsername())
                .fullName(projection.getFullName())
                .profileImageUrl(projection.getProfileImageUrl())
                .bio(projection.getBio())
                .websiteUrl(projection.getWebsiteUrl())
                .privateProfile(Boolean.TRUE.equals(projection.getIsPrivate()))
                .verified(Boolean.TRUE.equals(projection.getIsVerified()))
                .followersCount(defaultInt(projection.getFollowersCount()))
                .followingCount(defaultInt(projection.getFollowingCount()))
                .postsCount(defaultInt(projection.getPostsCount()))
                // TODO(Strangler Story/Post): questi flag restano dipendenti dai moduli stories/posts finché non completata la migrazione.
                .hasReels(Boolean.TRUE.equals(projection.getHasReels()))
                .hasAnyActiveStory(Boolean.TRUE.equals(projection.getHasAnyActiveStory()))
                .hasActiveStory(Boolean.TRUE.equals(projection.getHasActiveStory()))
                .hasViewedStory(Boolean.TRUE.equals(projection.getHasViewedStory()))
                .owner(isOwner)
                .canView(true)
                .followStatus(followStatus)
                .build();
    }

    @Override
    public ProfilePreviewDataDTO getProfilePreviewByUsername(UUID currentUserId, String targetUsername) {
        logger.info("Fetching profile preview. Current user: {}, Target username: {}", currentUserId, targetUsername);

        ProfilePreviewProjection projection = profileRepository.findProfilePreviewByUsername(targetUsername)
                .orElseThrow(() -> {
                    logger.warn("Target profile for preview not found. Username: {}", targetUsername);
                    return new ProfileNotFoundException("Profile not found");
                });

        FollowStatusDataDTO followStatusData = followService.getFollowStatus(currentUserId, targetUsername);
        String followStatus = followStatusData.getStatus();
        boolean isOwner = "self".equalsIgnoreCase(followStatus);
        boolean canView = isOwner
                || !Boolean.TRUE.equals(projection.getIsPrivate())
                || "accepted".equalsIgnoreCase(followStatus);

        // TODO(Post): sostituire [] con chiamata a PostService.getRecentPosts(profileId, 3) quando il modulo post sarà migrato.
        // TODO(Post): ogni mediaUrl dovrà essere un SAS URL temporaneo (15 min) generato via MediaService.
        List<RecentPostPreviewDto> recentPosts = List.of();

        return ProfilePreviewDataDTO.builder()
                .username(projection.getUsername())
                .fullName(projection.getFullName())
                .profileImageUrl(projection.getProfileImageUrl())
                .followersCount(defaultInt(projection.getFollowersCount()))
                .followingCount(defaultInt(projection.getFollowingCount()))
                .postsCount(defaultInt(projection.getPostsCount()))
                .followStatus(followStatus)
                .owner(isOwner)
                .canView(canView)
                .recentPosts(recentPosts)
                .build();
    }

    @Override
    public List<ProfileFollowerDataDTO> getFollowers(UUID currentUserId, String targetUsername) {
        logger.info("Fetching followers. Current user: {}, Target username: {}", currentUserId, targetUsername);

        ProfileVisibilityProfile currentProfile = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found while fetching followers. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("User profile not found");
                });

        ProfileVisibilityProfile targetProfile = profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(targetUsername)
                .orElseThrow(() -> {
                    logger.warn("Target profile not found while fetching followers. Username: {}", targetUsername);
                    return new ProfileNotFoundException("Profile not found");
                });

        boolean isOwner = currentProfile.getId().equals(targetProfile.getId());
        if (!isOwner && Boolean.TRUE.equals(targetProfile.getIsPrivate())) {
            Optional<ProfileVisibilityFollow> viewerFollowOpt = followRepository
                    .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(
                            currentProfile.getId(),
                            targetProfile.getId()
                    );

            boolean canViewPrivateFollowers = viewerFollowOpt.isPresent()
                    && "accepted".equalsIgnoreCase(viewerFollowOpt.get().getStatus());

            if (!canViewPrivateFollowers) {
                logger.warn("Forbidden followers access. Viewer profile: {}, Target profile: {}, Relationship status: {}",
                        currentProfile.getId(),
                        targetProfile.getId(),
                        viewerFollowOpt.map(ProfileVisibilityFollow::getStatus).orElse("none"));
                throw new ProfileForbiddenException("You cannot view followers for this private profile");
            }
        }

        List<ProfileFollowerProjection> followerRows = followRepository.findFollowersWithViewerStatus(
                targetProfile.getId(),
                currentProfile.getId()
        );

        List<ProfileFollowerDataDTO> result = followerRows.stream()
                .map(row -> new ProfileFollowerDataDTO(
                        row.getId(),
                        row.getUsername(),
                        row.getFullName(),
                        row.getProfileImageUrl(),
                        normalizeFollowerStatus(row.getFollowStatus())
                ))
                .toList();

        logger.info("Followers fetched successfully. Target username: {}, Count: {}, IsOwner: {}",
                targetUsername, result.size(), isOwner);
        return result;
    }

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeFollowerStatus(String status) {
        if ("accepted".equalsIgnoreCase(status)) {
            return "accepted";
        }
        if ("pending".equalsIgnoreCase(status)) {
            return "pending";
        }
        return "none";
    }
}
