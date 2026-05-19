package it.evodev.instagram.profile.picture.controllers;

import it.evodev.instagram.profile.picture.dto.ProfilePictureResponseDTO;
import it.evodev.instagram.profile.picture.exceptions.ProfilePictureException;
import it.evodev.instagram.profile.picture.services.ProfilePictureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/profiles/me/picture")
@RequiredArgsConstructor
public class ProfilePictureController {

    private final ProfilePictureService profilePictureService;

    @PutMapping
    public ResponseEntity<ProfilePictureResponseDTO> uploadPicture(
            @RequestParam(name = "image", required = false) MultipartFile file,
            Authentication authentication) throws IOException {
        UUID userId = resolveUserId(authentication);
        String blobName = profilePictureService.uploadPicture(userId, file);
        return ResponseEntity.ok(new ProfilePictureResponseDTO(true, blobName));
    }

    @DeleteMapping
    public ResponseEntity<ProfilePictureResponseDTO> removePicture(Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        profilePictureService.removePicture(userId);
        return ResponseEntity.ok(new ProfilePictureResponseDTO(true, null));
    }

    private UUID resolveUserId(Authentication authentication) {
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            throw new ProfilePictureException("PROFILE_NOT_FOUND", "Profile not found.");
        }
    }
}
