package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileVisibilityDataDTO;
import it.evodev.instagram.profile.service.ProfileVisibilityService;
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

@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class ProfileVisibilityController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileVisibilityController.class);

    private final ProfileVisibilityService profileVisibilityService;

    /**
     * GET /api/priv/profiles/{username}/can-view
     *
     * Determines if the authenticated user can view a target profile's contents.
     * Authentication is verified by Spring Security; no manual JWT validation needed.
     *
     * @param username target profile username (path param)
     * @param authentication spring security authentication containing current user UUID
     * @return response with canView flag
     */
    @GetMapping("/{username}/can-view")
    public ResponseEntity<ProfileApiResponse<ProfileVisibilityDataDTO>> canViewProfile(
            @PathVariable String username,
            Authentication authentication) {

        logger.info("GET /api/priv/profiles/{}/can-view - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());

        ProfileVisibilityDataDTO result = profileVisibilityService.canViewProfile(currentUserId, username);

        logger.info("Profile visibility check completed. Username: {}, CanView: {}", username, result.isCanView());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Visibility evaluated successfully"));
    }
}
