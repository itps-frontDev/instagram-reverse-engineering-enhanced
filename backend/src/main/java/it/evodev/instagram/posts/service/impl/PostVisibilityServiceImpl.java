package it.evodev.instagram.posts.service.impl;

import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.posts.service.PostVisibilityService;
import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Implementazione di PostVisibilityService.
 * 
 * Verifica l'accesso ai post in base alla visibilità del profilo del proprietario.
 */
@Service
@RequiredArgsConstructor
public class PostVisibilityServiceImpl implements PostVisibilityService {

    private static final Logger logger = LoggerFactory.getLogger(PostVisibilityServiceImpl.class);

    private final ProfileRepository profileRepository;
    private final FollowJpaRepository followRepository;

    @Override
    public boolean canViewPost(UUID currentUserId, Long postOwnerProfileId) {
        logger.debug("Evaluating post visibility. Current user: {}, Post owner: {}",
                currentUserId, postOwnerProfileId);

        Profile currentProfile = profileRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElse(null);

        if (currentProfile == null) {
            logger.warn("Current user profile not found. User ID: {}", currentUserId);
            return false;
        }

        // Decision: owner can always view own posts
        if (currentProfile.getId().equals(postOwnerProfileId)) {
            logger.debug("Post visibility: user is owner. Returning true");
            return true;
        }

        // Resolve post owner's profile
        Profile postOwnerProfile = profileRepository.findById(postOwnerProfileId)
                .orElse(null);
        
        if (postOwnerProfile == null) {
            logger.warn("Post owner profile not found. Profile ID: {}", postOwnerProfileId);
            return false;
        }

        // Decision: public profile always viewable
        if (!Boolean.TRUE.equals(postOwnerProfile.getIsPrivate())) {
            logger.debug("Post visibility: post owner is public. Returning true");
            return true;
        }

        // Decision: private profile - check follow status
        boolean isFollowing = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                        currentProfile.getId(),
                        postOwnerProfileId,
                        "accepted"
                )
                .isPresent();

        if (isFollowing) {
            logger.debug("Post visibility: post owner is private with accepted follow. Returning true");
        } else {
            logger.debug("Post visibility: post owner is private without follow. Returning false");
        }

        return isFollowing;
    }
}
