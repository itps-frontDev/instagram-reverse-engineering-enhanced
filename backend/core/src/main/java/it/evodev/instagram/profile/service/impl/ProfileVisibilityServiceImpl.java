package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.follow.models.Follow;
import it.evodev.instagram.follow.models.enums.FollowStatus;
import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileVisibilityServiceImpl implements ProfileVisibilityService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileVisibilityServiceImpl.class);

    private final ProfileJpaRepository profileRepository;
    private final FollowJpaRepository followRepository;

    @Override
    public ProfileVisibilityDataDTO canViewProfile(UUID currentUserId, String targetUsername) {
        logger.info("Evaluating profile visibility. Current user: {}, Target username: {}", currentUserId, targetUsername);

        // Resolve target profile by username
        Optional<Profile> targetOpt = profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(targetUsername);
        if (targetOpt.isEmpty()) {
            logger.warn("Target profile not found. Username: {}", targetUsername);
            throw new ProfileNotFoundException("Profile not found");
        }

        Profile targetProfile = targetOpt.get();

        // Resolve current user's profile
        Optional<Profile> currentOpt = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId);
        if (currentOpt.isEmpty()) {
            logger.warn("Current user profile not found. User ID: {}", currentUserId);
            throw new ProfileNotFoundException("User profile not found");
        }

        Profile currentProfile = currentOpt.get();

        // Decision: owner can always view
        if (currentProfile.getId().equals(targetProfile.getId())) {
            logger.info("Profile visibility: owner can view. Returning true");
            return new ProfileVisibilityDataDTO(true);
        }

        // Decision: public profile always viewable
        if (!targetProfile.getIsPrivate()) {
            logger.info("Profile visibility: target is public, no follow check needed. Returning true");
            return new ProfileVisibilityDataDTO(true);
        }

        // Decision: private profile - check follow status
        Optional<Follow> followOpt = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(currentProfile.getId(), targetProfile.getId());

        if (followOpt.isEmpty()) {
            logger.info("Profile visibility: target is private and no follow row exists. Returning false");
            return new ProfileVisibilityDataDTO(false);
        }

        if (FollowStatus.ACCEPTED.equalsValue(followOpt.get().getStatus())) {
            logger.info("Profile visibility: target is private with accepted follow row. Returning true");
            return new ProfileVisibilityDataDTO(true);
        }

        logger.info("Profile visibility: target is private but follow status is not accepted. Returning false");
        return new ProfileVisibilityDataDTO(false);
    }
}
