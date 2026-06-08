package it.evodev.instagram.follow.services.impl;

import it.evodev.instagram.follow.dto.responses.FollowerDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowMutationResponseDTO;
import it.evodev.instagram.follow.dto.responses.FollowStatusDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowToggleResponseDTO;
import it.evodev.instagram.follow.dto.responses.SuggestionDTO;
import it.evodev.instagram.follow.events.FollowAcceptedEvent;
import it.evodev.instagram.follow.events.FollowCreatedEvent;
import it.evodev.instagram.follow.events.FollowRemovedEvent;
import it.evodev.instagram.follow.events.FollowRequestedEvent;
import it.evodev.instagram.follow.exceptions.FollowForbiddenException;
import it.evodev.instagram.follow.exceptions.FollowNotFoundException;
import it.evodev.instagram.follow.exceptions.FollowValidationException;
import it.evodev.instagram.follow.models.Follow;
import it.evodev.instagram.follow.models.enums.FollowStatus;
import it.evodev.instagram.follow.repositories.FollowJpaRepository;
import it.evodev.instagram.follow.services.FollowService;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowServiceImpl implements FollowService {

    private static final Logger logger = LoggerFactory.getLogger(FollowServiceImpl.class);

    private final FollowJpaRepository followRepository;
    private final ProfileJpaRepository profileRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ─── Read ────────────────────────────────────────────────────────────────

    @Override
    public FollowStatusDataDTO getFollowStatus(UUID viewerUserId, String targetUsername) {
        Profile viewer = resolveByUserId(viewerUserId);
        Profile target = resolveByUsername(targetUsername);

        if (viewer.getId().equals(target.getId())) {
            return new FollowStatusDataDTO(FollowStatus.SELF.value());
        }

        String status = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(viewer.getId(), target.getId())
                .map(Follow::getStatus)
                .orElse(FollowStatus.NONE.value());

        return new FollowStatusDataDTO(status);
    }

    @Override
    public List<FollowerDataDTO> getFollowers(UUID viewerUserId, String targetUsername) {
        Profile viewer = resolveByUserId(viewerUserId);
        Profile target = resolveByUsername(targetUsername);

        enforceReadAccess(viewer, target, "followers");

        return followRepository.findFollowersWithViewerStatus(target.getId(), viewer.getId())
                .stream()
                .map(p -> new FollowerDataDTO(p.getId(), p.getUsername(), p.getFullName(),
                        p.getProfileImageUrl(), p.getFollowStatus()))
                .toList();
    }

    @Override
    public List<FollowerDataDTO> getFollowing(UUID viewerUserId, String targetUsername) {
        Profile viewer = resolveByUserId(viewerUserId);
        Profile target = resolveByUsername(targetUsername);

        enforceReadAccess(viewer, target, "following");

        return followRepository.findFollowingWithViewerStatus(target.getId(), viewer.getId())
                .stream()
                .map(p -> new FollowerDataDTO(p.getId(), p.getUsername(), p.getFullName(),
                        p.getProfileImageUrl(), p.getFollowStatus()))
                .toList();
    }

    @Override
    public List<SuggestionDTO> getSuggestions(UUID currentUserId) {
        Profile current = resolveByUserId(currentUserId);

        List<SuggestionDTO> top20 = followRepository.findSuggestionsForCurrentUser(current.getId())
                .stream()
                .map(p -> new SuggestionDTO(p.getId(), p.getUsername(), p.getFullName(),
                        p.getProfileImageUrl(), p.getFollowersCount()))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        if (top20.isEmpty()) {
            return Collections.emptyList();
        }

        Collections.shuffle(top20);
        return top20.stream().limit(5).toList();
    }

    // ─── Mutations ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FollowToggleResponseDTO toggle(UUID followerUserId, Long followingProfileId) {
        Profile follower = resolveByUserId(followerUserId);

        if (follower.getId().equals(followingProfileId)) {
            throw new FollowValidationException("Cannot follow yourself");
        }

        Optional<Follow> activeFollow = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(follower.getId(), followingProfileId);

        if (activeFollow.isPresent()) {
            Follow follow = activeFollow.get();
            String previousStatus = follow.getStatus();
            follow.setUpdatedAt(LocalDateTime.now());
            follow.setDeletedAt(LocalDateTime.now());
            followRepository.save(follow);

            if (FollowStatus.ACCEPTED.equalsValue(previousStatus)) {
                profileRepository.decrementFollowersCount(followingProfileId);
                profileRepository.decrementFollowingCount(follower.getId());
            }

            eventPublisher.publishEvent(new FollowRemovedEvent(follower.getId(), followingProfileId));
            logger.info("Profile {} unfollowed profile {}", follower.getId(), followingProfileId);
            return new FollowToggleResponseDTO("removed", FollowStatus.NONE.value());
        }

        boolean isPrivate = profileRepository.findById(followingProfileId)
                .map(p -> Boolean.TRUE.equals(p.getIsPrivate()))
                .orElseThrow(() -> new FollowNotFoundException("Profile not found: " + followingProfileId));

        Optional<Follow> softDeleted = followRepository
                .findByFollowerProfileIdAndFollowingProfileId(follower.getId(), followingProfileId);

        Follow follow;
        if (softDeleted.isPresent()) {
            follow = softDeleted.get();
            follow.setDeletedAt(null);
            follow.setUpdatedAt(LocalDateTime.now());
        } else {
            follow = new Follow();
            follow.setFollowerProfileId(follower.getId());
            follow.setFollowingProfileId(followingProfileId);
            follow.setCreatedAt(LocalDateTime.now());
            follow.setUpdatedAt(LocalDateTime.now());
        }

        if (isPrivate) {
            follow.setStatus(FollowStatus.PENDING.value());
            followRepository.save(follow);
            eventPublisher.publishEvent(new FollowRequestedEvent(follower.getId(), followingProfileId));
            logger.info("Profile {} sent follow request to private profile {}", follower.getId(), followingProfileId);
            return new FollowToggleResponseDTO("requested", FollowStatus.PENDING.value());
        } else {
            follow.setStatus(FollowStatus.ACCEPTED.value());
            followRepository.save(follow);
            profileRepository.incrementFollowersCount(followingProfileId);
            profileRepository.incrementFollowingCount(follower.getId());
            eventPublisher.publishEvent(new FollowCreatedEvent(follower.getId(), followingProfileId));
            logger.info("Profile {} followed public profile {}", follower.getId(), followingProfileId);
            return new FollowToggleResponseDTO("created", FollowStatus.ACCEPTED.value());
        }
    }

    @Override
    @Transactional
    public FollowMutationResponseDTO accept(UUID ownerUserId, Long requesterProfileId) {
        Profile owner = resolveByUserId(ownerUserId);

        Follow follow = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                        requesterProfileId, owner.getId(), FollowStatus.PENDING.value())
                .orElseThrow(() -> new FollowNotFoundException(
                        "Pending follow request not found from profile " + requesterProfileId));

        follow.setStatus(FollowStatus.ACCEPTED.value());
        follow.setUpdatedAt(LocalDateTime.now());
        followRepository.save(follow);

        profileRepository.incrementFollowersCount(owner.getId());
        profileRepository.incrementFollowingCount(requesterProfileId);

        eventPublisher.publishEvent(new FollowAcceptedEvent(requesterProfileId, owner.getId()));
        logger.info("Profile {} accepted follow request from profile {}", owner.getId(), requesterProfileId);
        return new FollowMutationResponseDTO(true);
    }

    @Override
    @Transactional
    public FollowMutationResponseDTO reject(UUID ownerUserId, Long requesterProfileId) {
        Profile owner = resolveByUserId(ownerUserId);

        Follow follow = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                        requesterProfileId, owner.getId(), FollowStatus.PENDING.value())
                .orElseThrow(() -> new FollowNotFoundException(
                        "Pending follow request not found from profile " + requesterProfileId));

        follow.setStatus(FollowStatus.REJECTED.value());
        follow.setUpdatedAt(LocalDateTime.now());
        follow.setDeletedAt(LocalDateTime.now());
        followRepository.save(follow);

        eventPublisher.publishEvent(new FollowRemovedEvent(requesterProfileId, owner.getId()));
        logger.info("Profile {} rejected follow request from profile {}", owner.getId(), requesterProfileId);
        return new FollowMutationResponseDTO(true);
    }

    @Override
    @Transactional
    public FollowMutationResponseDTO removeFollower(UUID ownerUserId, Long followerProfileId) {
        Profile owner = resolveByUserId(ownerUserId);

        Follow follow = followRepository
                .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                        followerProfileId, owner.getId(), FollowStatus.ACCEPTED.value())
                .orElseThrow(() -> new FollowNotFoundException(
                        "Active follower not found: profile " + followerProfileId));

        follow.setUpdatedAt(LocalDateTime.now());
        follow.setDeletedAt(LocalDateTime.now());
        followRepository.save(follow);

        profileRepository.decrementFollowersCount(owner.getId());
        profileRepository.decrementFollowingCount(followerProfileId);

        eventPublisher.publishEvent(new FollowRemovedEvent(followerProfileId, owner.getId()));
        logger.info("Profile {} removed follower profile {}", owner.getId(), followerProfileId);
        return new FollowMutationResponseDTO(true);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Profile resolveByUserId(UUID userId) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new FollowNotFoundException("User profile not found for userId: " + userId));
    }

    private Profile resolveByUsername(String username) {
        return profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(username)
                .orElseThrow(() -> new FollowNotFoundException("Profile not found: " + username));
    }

    private void enforceReadAccess(Profile viewer, Profile target, String listType) {
        boolean isOwner = viewer.getId().equals(target.getId());
        if (!isOwner && Boolean.TRUE.equals(target.getIsPrivate())) {
            boolean isAcceptedFollower = followRepository
                    .findByFollowerProfileIdAndFollowingProfileIdAndStatusAndDeletedAtIsNull(
                            viewer.getId(), target.getId(), FollowStatus.ACCEPTED.value())
                    .isPresent();
            if (!isAcceptedFollower) {
                logger.warn("Forbidden {} access. Viewer: {}, Target: {}", listType, viewer.getId(), target.getId());
                throw new FollowForbiddenException("You cannot view " + listType + " for this private profile");
            }
        }
    }
}
