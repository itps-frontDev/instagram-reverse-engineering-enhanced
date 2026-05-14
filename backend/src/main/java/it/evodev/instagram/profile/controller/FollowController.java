package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.response.FollowStatusDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
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

import java.util.UUID;

/**
 * REST Controller for managing follow relationships between profiles.
 * Handles follow status checks and future follow/unfollow/accept/reject operations.
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
}
