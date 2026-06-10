package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowStatusDataDTO;
import it.evodev.instagram.follow.models.enums.FollowStatus;
import it.evodev.instagram.follow.services.FollowService;
import it.evodev.instagram.posts.repository.PostRepository;
import it.evodev.instagram.posts.repository.PostReelsRepository;
import it.evodev.instagram.profile.dto.response.MeProfileResponseDTO;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;
import it.evodev.instagram.posts.model.enums.MediaType;
import it.evodev.instagram.profile.dto.response.RecentPostPreviewDTO;
import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.MeProfileProjection;
import it.evodev.instagram.profile.repository.ProfileByUsernameProjection;
import it.evodev.instagram.profile.repository.ProfilePreviewProjection;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.profile.service.ProfileReadService;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import it.evodev.instagram.auth.repositories.UserRepository;
import it.evodev.instagram.auth.models.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileReadServiceImpl implements ProfileReadService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileReadServiceImpl.class);

    private final ProfileJpaRepository profileRepository;
    private final ProfileVisibilityService profileVisibilityService;
    private final FollowService followService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostReelsRepository postReelsRepository;

    @Override
    public ProfileByUsernameDataDTO getProfileByUsername(UUID currentUserId, String targetUsername) {
        logger.info("Fetching profile by username. Current user: {}, Target username: {}", currentUserId, targetUsername);

        Optional<Profile> currentProfileOpt = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId);
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
        boolean isOwner = FollowStatus.SELF.equalsValue(followStatus);

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
        boolean isOwner = FollowStatus.SELF.equalsValue(followStatus);
        boolean canView = isOwner
                || !Boolean.TRUE.equals(projection.getIsPrivate())
                || FollowStatus.ACCEPTED.equalsValue(followStatus);

        List<RecentPostPreviewDTO> recentPosts = canView
                ? fetchRecentPosts(projection.getId())
                : List.of();

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

    private List<RecentPostPreviewDTO> fetchRecentPosts(Long profileId) {
        // Recupera sia i post normali che i reels per mostrare i 3 contenuti più recenti
        List<Map<String, Object>> postsRaw = postRepository.findProfilePosts(profileId, PageRequest.of(0, 3));
        List<Map<String, Object>> reelsRaw = postReelsRepository.findProfileReels(profileId, PageRequest.of(0, 3));
        
        // Combina, deduplicata per ID (in caso di overlap), ordina per data decrescente, poi prendi i primi 3
        return java.util.stream.Stream.concat(postsRaw.stream(), reelsRaw.stream())
                .map(m -> RecentPostPreviewDTO.builder()
                        .id(((Number) m.get("id")).longValue())
                        .mediaUrl((String) m.get("mediaUrl"))
                        .mediaType(MediaType.fromString((String) m.get("mediaType")))
                        .createdAt((java.time.Instant) m.get("createdAt"))
                        .build())
                .collect(Collectors.toMap(
                        RecentPostPreviewDTO::getId,
                        post -> post,
                        (existing, newer) -> newer
                ))
                .values()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(3)
                .toList();
    }

    @Override
    public MeProfileResponseDTO getMyProfile(UUID currentUserId) {
        logger.info("Fetching me profile for user: {}", currentUserId);

        MeProfileProjection p = profileRepository.findMeProfileByUserId(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Profile not found for user: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        return MeProfileResponseDTO.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .username(p.getUsername())
                .fullName(p.getFullName())
                .profileImageUrl(p.getProfileImageUrl())
                .bio(p.getBio())
                .websiteUrl(p.getWebsiteUrl())
                .gender(p.getGender())
                .customGender(p.getCustomGender())
                .privateProfile(Boolean.TRUE.equals(p.getIsPrivate()))
                .verified(Boolean.TRUE.equals(p.getIsVerified()))
                .followersCount(defaultInt(p.getFollowersCount()))
                .followingCount(defaultInt(p.getFollowingCount()))
                .postsCount(defaultInt(p.getPostsCount()))
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
