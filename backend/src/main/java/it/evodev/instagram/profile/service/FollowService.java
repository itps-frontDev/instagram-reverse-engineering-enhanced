package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileFollowerDataDTO;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing follow relationships between profiles.
 * Handles reading and mutations (follow, unfollow, accept, reject).
 */
public interface FollowService {
    /**
     * Determine the follow status between the current user and a target profile.
     *
     * @param currentUserId UUID of the authenticated user
     * @param targetUsername username of the profile to check against (case-insensitive)
     * @return FollowStatusDataDTO with status: "self" | "none" | "pending" | "accepted"
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if target profile not found
     */
    FollowStatusDataDTO getFollowStatus(UUID currentUserId, String targetUsername);

    /**
     * Fetch the list of profiles that follow the target profile.
     * Respects privacy: owner always sees it, public profiles visible to all,
     * private profiles only visible to accepted followers.
     *
     * @param currentUserId UUID of the authenticated user making the request
     * @param targetUsername username of the profile whose followers are requested
     * @return List of ProfileFollowerDataDTO with follow status relative to current user
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if profiles not found
     * @throws it.evodev.instagram.profile.exception.ProfileForbiddenException if access denied
     */
    List<ProfileFollowerDataDTO> getFollowers(UUID currentUserId, String targetUsername);

    /**
     * Fetch the list of profiles that the target profile follows.
     * Respects privacy: owner always sees it, public profiles visible to all,
     * private profiles only visible to accepted followers.
     *
     * @param currentUserId UUID of the authenticated user making the request
     * @param targetUsername username of the profile whose following list is requested
     * @return List of ProfileFollowerDataDTO with follow status relative to current user
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if profiles not found
     * @throws it.evodev.instagram.profile.exception.ProfileForbiddenException if access denied
     */
    List<ProfileFollowerDataDTO> getFollowing(UUID currentUserId, String targetUsername);

    /**
     * Get profile suggestions for the current user.
     * Returns top-20 public profiles not yet followed, shuffled to provide variety.
     * 
     * Excludes:
     * - Current user's own profile
     * - Profiles already followed (accepted status)
     * - Profiles with pending follow request
     * - Soft-deleted profiles
     * - Private profiles
     * 
     * @param currentUserId UUID of the authenticated user
     * @return List of up to 5 suggested ProfileSuggestionDTO ordered by popularity with shuffle applied
     */
    List<it.evodev.instagram.profile.dto.response.ProfileSuggestionDTO> getSuggestions(UUID currentUserId);
}
