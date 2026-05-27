package it.evodev.instagram.profile.controllers;

import it.evodev.instagram.profile.dto.request.ProfileSecurityUpdateRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileSecurityDataDTO;
import it.evodev.instagram.profile.service.ProfileSecurityService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/priv/profiles")
public class ProfileSecurityController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileSecurityController.class);

    private final ProfileSecurityService profileSecurityService;

    public ProfileSecurityController(ProfileSecurityService profileSecurityService) {
        this.profileSecurityService = profileSecurityService;
    }

    /**
     * GET /api/priv/profiles/security
     * Restituisce email e telefono dell'utente autenticato senza esporre dati sensibili.
     */
    @GetMapping("/security")
    public ResponseEntity<ProfileApiResponse<ProfileSecurityDataDTO>> getSecurityData(Authentication authentication) {
        logger.info("GET /api/priv/profiles/security - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfileSecurityDataDTO data = profileSecurityService.getSecurityData(currentUserId);

        return ResponseEntity.ok(ProfileApiResponse.success(data, "Security info fetched successfully"));
    }

    /**
     * PUT /api/priv/profiles/security
     * Aggiorna in modo parziale email, telefono e password dell'utente autenticato.
     */
    @PutMapping("/security")
    public ResponseEntity<ProfileApiResponse<ProfileSecurityDataDTO>> updateSecurityData(
            @Valid @RequestBody ProfileSecurityUpdateRequestDTO request,
            Authentication authentication
    ) {
        logger.info("PUT /api/priv/profiles/security - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfileSecurityDataDTO data = profileSecurityService.updateSecurityData(currentUserId, request);

        return ResponseEntity.ok(ProfileApiResponse.success(data, "Security info updated successfully"));
    }
}
