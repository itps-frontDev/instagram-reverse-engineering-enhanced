package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileFollowerDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileSuggestionDTO;
import it.evodev.instagram.profile.exception.ProfileForbiddenException;
import it.evodev.instagram.profile.exception.ProfileNotFoundException;
import it.evodev.instagram.profile.model.ProfileVisibilityFollow;
import it.evodev.instagram.profile.model.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileFollowerProjection;
import it.evodev.instagram.profile.repository.ProfileSuggestionProjection;
import it.evodev.instagram.profile.repository.ProfileVisibilityFollowJpaRepository;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private static final Logger logger = LoggerFactory.getLogger(FollowServiceImpl.class);

    private final ProfileVisibilityProfileJpaRepository profileRepository;
    private final ProfileVisibilityFollowJpaRepository followRepository;

    @Override
    public FollowStatusDataDTO getFollowStatus(UUID currentUserId, String targetUsername) {
        logger.info("Evaluating follow status. Current user: {}, Target username: {}", currentUserId, targetUsername);

        // Resolve target profile by username (case-insensitive, not soft-deleted)
        Optional<ProfileVisibilityProfile> targetOpt = profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(targetUsername);
        if (targetOpt.isEmpty()) {
            logger.warn("Target profile not found. Username: {}", targetUsername);
            throw new ProfileNotFoundException("Profile not found");
        }

        ProfileVisibilityProfile targetProfile = targetOpt.get();

        // Resolve current user's profile
        Optional<ProfileVisibilityProfile> currentOpt = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId);
        if (currentOpt.isEmpty()) {
            logger.warn("Current user profile not found. User ID: {}", currentUserId);
            throw new ProfileNotFoundException("User profile not found");
        }

        ProfileVisibilityProfile currentProfile = currentOpt.get();

        // Decision: self check
        if (currentProfile.getId().equals(targetProfile.getId())) {
            logger.info("Follow status: self. Returning 'self'");
            return new FollowStatusDataDTO("self");
        }

        // Decision: check follow relationship
        Optional<ProfileVisibilityFollow> followOpt = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(currentProfile.getId(), targetProfile.getId());

        String status;
        if (followOpt.isEmpty()) {
            status = "none";
            logger.info("Follow status: no follow relationship. Returning 'none'");
        } else {
            status = followOpt.get().getStatus();
            logger.info("Follow status: follow relationship found. Returning '{}'", status);
        }

        return new FollowStatusDataDTO(status);
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

    @Override
    public List<ProfileFollowerDataDTO> getFollowing(UUID currentUserId, String targetUsername) {
        logger.info("Fetching following. Current user: {}, Target username: {}", currentUserId, targetUsername);

        ProfileVisibilityProfile currentProfile = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found while fetching following. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("User profile not found");
                });

        ProfileVisibilityProfile targetProfile = profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(targetUsername)
                .orElseThrow(() -> {
                    logger.warn("Target profile not found while fetching following. Username: {}", targetUsername);
                    return new ProfileNotFoundException("Profile not found");
                });

        boolean isOwner = currentProfile.getId().equals(targetProfile.getId());
        if (!isOwner && Boolean.TRUE.equals(targetProfile.getIsPrivate())) {
            Optional<ProfileVisibilityFollow> viewerFollowOpt = followRepository
                    .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(
                            currentProfile.getId(),
                            targetProfile.getId()
                    );

            boolean canViewPrivateFollowing = viewerFollowOpt.isPresent()
                    && "accepted".equalsIgnoreCase(viewerFollowOpt.get().getStatus());

            if (!canViewPrivateFollowing) {
                logger.warn("Forbidden following access. Viewer profile: {}, Target profile: {}, Relationship status: {}",
                        currentProfile.getId(),
                        targetProfile.getId(),
                        viewerFollowOpt.map(ProfileVisibilityFollow::getStatus).orElse("none"));
                throw new ProfileForbiddenException("You cannot view following list for this private profile");
            }
        }

        List<ProfileFollowerProjection> followingRows = followRepository.findFollowingWithViewerStatus(
                targetProfile.getId(),
                currentProfile.getId()
        );

        List<ProfileFollowerDataDTO> result = followingRows.stream()
                .map(row -> new ProfileFollowerDataDTO(
                        row.getId(),
                        row.getUsername(),
                        row.getFullName(),
                        row.getProfileImageUrl(),
                        normalizeFollowerStatus(row.getFollowStatus())
                ))
                .toList();

        logger.info("Following fetched successfully. Target username: {}, Count: {}, IsOwner: {}",
                targetUsername, result.size(), isOwner);
        return result;
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

    @Override
    public List<ProfileSuggestionDTO> getSuggestions(UUID currentUserId) {
        logger.info("Fetching profile suggestions for current user: {}", currentUserId);

        // Resolve current user's profile
        Optional<ProfileVisibilityProfile> currentOpt = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId);
        if (currentOpt.isEmpty()) {
            logger.warn("Current user profile not found. User ID: {}", currentUserId);
            throw new ProfileNotFoundException("User profile not found");
        }

        ProfileVisibilityProfile currentProfile = currentOpt.get();

        // Query top-20 public profiles not yet followed
        List<ProfileSuggestionProjection> top20 = followRepository.findSuggestionsForCurrentUser(currentProfile.getId());

        if (top20.isEmpty()) {
            logger.info("No suggestions available for user: {}", currentUserId);
            return Collections.emptyList();
        }

        // Shuffle in-memory to provide variety while maintaining popularity priority
        Collections.shuffle(top20);

        // Take first 5 after shuffle
        List<ProfileSuggestionDTO> suggestions = top20.stream()
                .limit(5)
                .map(proj -> new ProfileSuggestionDTO(
                        proj.getId(),
                        proj.getUsername(),
                        proj.getFullName(),
                        proj.getProfileImageUrl(),
                        proj.getFollowersCount()
                ))
                .toList();

        logger.info("Profile suggestions fetched successfully. Count: {}", suggestions.size());
        return suggestions;
    }
}
