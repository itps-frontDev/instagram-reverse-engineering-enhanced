package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePreviewDataDTO;
import it.evodev.instagram.profile.service.ProfileReadService;
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
public class ProfileController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    private final ProfileReadService profileReadService;

    /**
     * GET /api/priv/profiles/{username}
     * Restituisce il profilo target con visibilità e follow status rispetto all'utente autenticato.
     */
    @GetMapping("/{username}")
    public ResponseEntity<ProfileApiResponse<ProfileByUsernameDataDTO>> getProfileByUsername(
            @PathVariable String username,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{} - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfileByUsernameDataDTO result = profileReadService.getProfileByUsername(currentUserId, username);

        logger.info("Profile fetched successfully. Username: {}, CanView: {}, FollowStatus: {}", 
                username, result.isCanView(), result.getFollowStatus());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Profile fetched successfully"));
    }

    /**
     * GET /api/priv/profiles/{username}/preview
     * Restituisce una preview leggera del profilo target per hover card e UI compatte.
     */
    @GetMapping("/{username}/preview")
    public ResponseEntity<ProfileApiResponse<ProfilePreviewDataDTO>> getProfilePreviewByUsername(
            @PathVariable String username,
            Authentication authentication
    ) {
        logger.info("GET /api/priv/profiles/{}/preview - User: {}", username, authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfilePreviewDataDTO result = profileReadService.getProfilePreviewByUsername(currentUserId, username);

        logger.info("Profile preview fetched successfully. Username: {}, CanView: {}, FollowStatus: {}",
                username, result.isCanView(), result.getFollowStatus());

        return ResponseEntity.ok(ProfileApiResponse.success(result, "Profile preview fetched successfully"));
    }

    /**
     * GET /api/priv/profiles/birthday
     * Restituisce la data di nascita del profilo autenticato.
     */
    @GetMapping("/birthday")
    public ResponseEntity<ProfileApiResponse<BirthdayDataDTO>> getBirthday(Authentication authentication) {
        logger.info("GET /api/priv/profiles/birthday - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        BirthdayDataDTO response = profileReadService.getBirthday(currentUserId);

        logger.info("Birthday retrieved successfully for user: {}", currentUserId);
        return ResponseEntity.ok(ProfileApiResponse.success(response, "Birthday retrieved successfully"));
    }
}
