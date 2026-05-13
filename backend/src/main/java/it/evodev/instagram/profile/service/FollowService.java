package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.FollowStatusDataDTO;

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
}
