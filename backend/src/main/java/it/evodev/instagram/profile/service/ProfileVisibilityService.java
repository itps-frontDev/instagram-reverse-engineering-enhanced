package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;

import java.util.UUID;

public interface ProfileVisibilityService {
    /**
     * Determines if the authenticated user can view a target profile's contents.
     *
     * Logic:
     * - Target profile missing or soft-deleted: throws ProfileNotFoundException
     * - Current user is owner: true
     * - Public profile: true
     * - Private profile + follow accepted: true
     * - Private profile + follow pending or no follow: false
     *
     * @param currentUserId UUID of authenticated user (from Authentication.getName())
     * @param targetUsername username of target profile
     * @return ProfileVisibilityDataDTO with canView flag
     */
    ProfileVisibilityDataDTO canViewProfile(UUID currentUserId, String targetUsername);
}
