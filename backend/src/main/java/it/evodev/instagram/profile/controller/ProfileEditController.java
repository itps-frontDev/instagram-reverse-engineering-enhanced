package it.evodev.instagram.profile.controller;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.request.ProfilePersonalRequestDTO;
import it.evodev.instagram.profile.dto.request.UpdateBirthdayRequestDTO;
import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileApiResponse;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditResponseDTO;
import it.evodev.instagram.profile.dto.response.ProfilePersonalDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePersonalResponseDTO;
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
     * Aggiorna i campi descrittivi del profilo autenticato.
     * Mantiene il path legacy per compatibilità durante la migrazione Strangler.
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

    /**
     * PUT /api/priv/profiles/personal
     * Aggiorna i dati personali del profilo autenticato.
     * Mantiene il path legacy per compatibilità durante la migrazione Strangler.
     */
    @PutMapping("/personal")
    public ResponseEntity<ProfilePersonalResponseDTO> updatePersonalInfo(
            @Valid @RequestBody ProfilePersonalRequestDTO request,
            Authentication authentication
    ) {
        logger.info("PUT /api/priv/profiles/personal - User: {}", authentication.getName());

        UUID currentUserId = UUID.fromString(authentication.getName());
        ProfilePersonalDataDTO updated = profileEditService.updatePersonalInfo(currentUserId, request);

        return ResponseEntity.ok(new ProfilePersonalResponseDTO(true, updated, "Personal information updated successfully"));
    }

    /**
     * PUT /api/priv/profiles/birthday
     * Aggiorna la data di nascita del profilo autenticato.
     * La validazione di età minima (13 anni) è applicata nel service layer.
     */
    @PutMapping("/birthday")
    public ResponseEntity<ProfileApiResponse<BirthdayDataDTO>> updateBirthday(
            Authentication authentication,
            @Valid @RequestBody UpdateBirthdayRequestDTO request
    ) {
        logger.info("PUT /api/priv/profiles/birthday - User: {} - Birthday: {}", 
                authentication.getName(), request.getBirthday());

        UUID currentUserId = UUID.fromString(authentication.getName());
        BirthdayDataDTO response = profileEditService.updateBirthday(currentUserId, request);

        logger.info("Birthday updated successfully for user: {} to: {}", currentUserId, request.getBirthday());
        return ResponseEntity.ok(ProfileApiResponse.success(response, "Birthday updated successfully"));
    }
}
