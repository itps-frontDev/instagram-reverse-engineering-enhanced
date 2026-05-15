package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditResponseDTO;
import it.evodev.instagram.profile.service.ProfileEditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/priv/profiles")
@RequiredArgsConstructor
public class ProfileEditController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileEditController.class);

    private final ProfileEditService profileEditService;

    /**
     * PUT /api/priv/profiles/edit
     *
     * Metodo PUT per aggiornare i campi descrittivi del profilo autenticato.
     * Il path /edit mantiene compatibilità funzionale con il legacy Next.js durante la migrazione Strangler.
     */
    @PutMapping("/edit")
    public ResponseEntity<ProfileEditResponseDTO> editProfile(
            @Valid @RequestBody ProfileEditRequestDTO request,
            Authentication authentication
    ) {
        logger.info("PUT /api/priv/profiles/edit - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfileEditDataDTO updated = profileEditService.editProfile(currentUserId, request);

        return ResponseEntity.ok(new ProfileEditResponseDTO(true, updated, "Profile updated successfully"));
    }
}
