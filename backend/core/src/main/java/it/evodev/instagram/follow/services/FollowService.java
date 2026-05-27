package it.evodev.instagram.follow.services;

import it.evodev.instagram.follow.dto.responses.FollowerDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowMutationResponseDTO;
import it.evodev.instagram.follow.dto.responses.FollowStatusDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowToggleResponseDTO;
import it.evodev.instagram.follow.dto.responses.SuggestionDTO;

import java.util.List;
import java.util.UUID;

public interface FollowService {

    FollowStatusDataDTO getFollowStatus(UUID viewerUserId, String targetUsername);

    List<FollowerDataDTO> getFollowers(UUID viewerUserId, String targetUsername);

    List<FollowerDataDTO> getFollowing(UUID viewerUserId, String targetUsername);

    List<SuggestionDTO> getSuggestions(UUID currentUserId);

    FollowToggleResponseDTO toggle(UUID followerUserId, Long followingProfileId);

    FollowMutationResponseDTO accept(UUID ownerUserId, Long requesterProfileId);

    FollowMutationResponseDTO reject(UUID ownerUserId, Long requesterProfileId);

    FollowMutationResponseDTO removeFollower(UUID ownerUserId, Long followerProfileId);
}
