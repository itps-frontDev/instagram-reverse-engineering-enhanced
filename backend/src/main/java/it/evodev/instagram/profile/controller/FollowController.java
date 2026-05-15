package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileFollowerDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileSuggestionDTO;
import it.evodev.instagram.profile.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for managing follow relationships between profiles.
 * Handles follow status checks, follow lists, and future follow/unfollow/accept/reject operations.
 */
@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class FollowController {

    private static final Logger logger = LoggerFactory.getLogger(FollowController.class);

    private final FollowService followService;

    /**
     * GET /api/priv/profiles/{username}/follow-status
     *
     * Determines the follow relationship status between the authenticated user and a target profile.
     * Authentication is verified by Spring Security; no manual JWT validation needed.
     * This is a viewer-specific endpoint: uses the authenticated principal to compare with the target.
     *
     * @param username target profile username (case-insensitive)
     * @param authentication Spring Security authentication containing current user UUID
     * @return response with follow status: "self" | "none" | "pending" | "accepted"
     */
    @GetMapping("/{username}/follow-status")
    public ResponseEntity<ProfileApiResponse<FollowStatusDataDTO>> getFollowStatus(
            @PathVariable String username,
            Authentication authentication) {

        logger.info("GET /api/priv/profiles/{}/follow-status - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());

        FollowStatusDataDTO result = followService.getFollowStatus(currentUserId, username);

        logger.info("Follow status evaluated. Username: {}, Status: {}", username, result.getStatus());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Follow status evaluated successfully"));
    }

    /**
     * GET /api/priv/profiles/{username}/followers
     *
     * Fetch the list of profiles that follow the target profile.
     * Respects privacy: owner always sees it, public profiles visible to all,
     * private profiles only visible to accepted followers.
     * Authentication is verified by Spring Security; no manual JWT validation needed.
     *
     * @param username target profile username whose followers are requested (case-insensitive)
     * @param authentication Spring Security authentication containing current user UUID
     * @return response with list of ProfileFollowerDataDTO, each with follow status relative to current user
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<ProfileApiResponse<List<ProfileFollowerDataDTO>>> getFollowersByUsername(
            @PathVariable String username,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{}/followers - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        List<ProfileFollowerDataDTO> result = followService.getFollowers(currentUserId, username);

        logger.info("Followers fetched successfully. Username: {}, Count: {}", username, result.size());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Followers fetched successfully"));
    }

    /**
     * GET /api/priv/profiles/{username}/following
     *
     * Fetch the list of profiles that the target profile follows.
     * Respects privacy: owner always sees it, public profiles visible to all,
     * private profiles only visible to accepted followers.
     * Authentication is verified by Spring Security; no manual JWT validation needed.
     * This is the inverse of the followers list: instead of "who follows the target",
     * it returns "who the target follows".
     *
     * @param username target profile username whose following list is requested (case-insensitive)
     * @param authentication Spring Security authentication containing current user UUID
     * @return response with list of ProfileFollowerDataDTO, each with follow status relative to current user
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<ProfileApiResponse<List<ProfileFollowerDataDTO>>> getFollowingByUsername(
            @PathVariable String username,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{}/following - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        List<ProfileFollowerDataDTO> result = followService.getFollowing(currentUserId, username);

        logger.info("Following fetched successfully. Username: {}, Count: {}", username, result.size());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Following fetched successfully"));
    }

    /**
     * GET /api/priv/profiles/suggestions
     *
     * Get profile suggestions for the authenticated user to discover new profiles to follow.
     * Returns top public profiles not yet followed, shuffled for variety.
     * 
     * Excludes:
     * - Current user's own profile
     * - Profiles already followed (accepted status)
     * - Profiles with pending follow request
     * - Soft-deleted profiles
     * - Private profiles
     * 
     * Authentication is verified by Spring Security; no manual JWT validation needed.
     *
     * @param authentication Spring Security authentication containing current user UUID
     * @return response with list of up to 5 ProfileSuggestionDTO ordered by popularity
     */
    @GetMapping("/suggestions")
    public ResponseEntity<ProfileApiResponse<List<ProfileSuggestionDTO>>> getSuggestions(
            Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/suggestions - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        List<ProfileSuggestionDTO> result = followService.getSuggestions(currentUserId);

        logger.info("Suggestions fetched successfully. Count: {}", result.size());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Suggestions fetched successfully"));
    }
}
