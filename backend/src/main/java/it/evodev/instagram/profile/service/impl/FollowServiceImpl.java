package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.exception.ProfileNotFoundException;
import it.evodev.instagram.profile.model.ProfileVisibilityFollow;
import it.evodev.instagram.profile.model.ProfileVisibilityProfile;
import it.evodev.instagram.profile.repository.ProfileVisibilityFollowJpaRepository;
import it.evodev.instagram.profile.repository.ProfileVisibilityProfileJpaRepository;
import it.evodev.instagram.profile.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
}
