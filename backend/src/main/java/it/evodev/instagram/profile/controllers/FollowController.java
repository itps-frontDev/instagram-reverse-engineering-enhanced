package it.evodev.instagram.profile.controllers;

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
 * Controller per operazioni di relazione follow tra profili.
 */
@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class FollowController {

    private static final Logger logger = LoggerFactory.getLogger(FollowController.class);

    private final FollowService followService;

    /**
     * GET /api/priv/profiles/{username}/follow-status
     * Restituisce lo stato di follow tra utente autenticato e profilo target.
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
     * Restituisce la lista follower del profilo target rispettando le regole di privacy.
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
     * Restituisce la lista profili seguiti dal target rispettando le regole di privacy.
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
     * Restituisce suggerimenti di profili pubblici non ancora seguiti dall'utente autenticato.
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
