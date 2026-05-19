package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;
import it.evodev.instagram.profile.dto.response.RecentPostPreviewDTO;
import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.models.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileByUsernameProjection;
import it.evodev.instagram.profile.repository.ProfilePreviewProjection;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.FollowService;
import it.evodev.instagram.profile.service.ProfileReadService;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import it.evodev.instagram.auth.repositories.UserRepository;
import it.evodev.instagram.auth.models.User;
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
    private final ProfileVisibilityService profileVisibilityService;
    private final FollowService followService;
    private final UserRepository userRepository;

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
        List<RecentPostPreviewDTO> recentPosts = List.of();

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

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }

    @Override
    public BirthdayDataDTO getBirthday(UUID currentUserId) {
        logger.info("Fetching birthday for user: {}", currentUserId);

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("User not found for birthday fetch. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        logger.info("Birthday fetched successfully for user: {}", currentUserId);
        return new BirthdayDataDTO(user.getDateOfBirth());
    }
}
