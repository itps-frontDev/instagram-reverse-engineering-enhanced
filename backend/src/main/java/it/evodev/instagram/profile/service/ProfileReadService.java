package it.evodev.instagram.profile.service;

import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;

import java.util.UUID;

/**
 * Service for reading profile data and context.
 * Handles fetching profile information with visibility and access control checks.
 */
public interface ProfileReadService {
    /**
     * Fetch complete profile data including followers/following counts, privacy status,
     * and current user's follow context relative to the target profile.
     *
     * @param currentUserId UUID of the authenticated user making the request
     * @param targetUsername username of the profile to fetch (case-insensitive)
     * @return ProfileByUsernameDataDTO with full profile data and visibility context
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if profile not found or soft-deleted
     */
    ProfileByUsernameDataDTO getProfileByUsername(UUID currentUserId, String targetUsername);

    /**
     * Fetch lightweight profile data for preview/hover cards.
     * Returns minimal data (username, bio, image, counts) plus recent posts.
     * Used primarily for UI card hovers where full profile fetch is overkill.
     *
     * @param currentUserId UUID of the authenticated user making the request
     * @param targetUsername username of the profile to preview (case-insensitive)
     * @return ProfilePreviewDataDTO with minimal profile data and recent posts
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if profile not found or soft-deleted
     */
    ProfilePreviewDataDTO getProfilePreviewByUsername(UUID currentUserId, String targetUsername);

    /**
     * Fetch the birthday of the authenticated user.
     * 
     * @param currentUserId UUID of the authenticated user
     * @return BirthdayDataDTO with birthday in LocalDate format
     * @throws it.evodev.instagram.profile.exception.ProfileNotFoundException if profile not found
     */
    BirthdayDataDTO getBirthday(UUID currentUserId);
}
