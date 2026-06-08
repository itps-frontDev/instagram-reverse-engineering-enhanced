package it.evodev.instagram.likes.strategies;

import it.evodev.instagram.follow.models.enums.FollowStatus;
import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import it.evodev.instagram.likes.exceptions.LikeValidationException;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LikeAccessChecker {

    private final ProfileJpaRepository profileRepository;
    private final FollowJpaRepository followRepository;

    /**
     * Throws {@link LikeValidationException} if {@code requesterProfileId} cannot access
     * content owned by {@code ownerProfileId}.
     *
     * Access is granted when:
     * - requester is the owner
     * - owner's profile is public
     * - owner's profile is private but requester has an accepted follow
     */
    public void enforceAccess(Long requesterProfileId, Long ownerProfileId) {
        if (requesterProfileId.equals(ownerProfileId)) {
            return;
        }

        boolean isPrivate = profileRepository.findById(ownerProfileId)
                .map(p -> Boolean.TRUE.equals(p.getIsPrivate()))
                .orElse(false);

        if (!isPrivate) {
            return;
        }

        boolean follows = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                        requesterProfileId, ownerProfileId, FollowStatus.ACCEPTED.value())
                .isPresent();

        if (!follows) {
            throw new LikeValidationException("Cannot like content from a private profile you do not follow");
        }
    }
}
