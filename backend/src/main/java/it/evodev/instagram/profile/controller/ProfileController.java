package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileByUsernameDataDTO;
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
     *
     * Metodo GET perché l'operazione è di sola lettura del profilo target.
     * Il path usa {username} perché identifica in modo naturale la risorsa profilo lato UI.
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
}
