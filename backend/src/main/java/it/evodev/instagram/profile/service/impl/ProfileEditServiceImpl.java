package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;
import it.evodev.instagram.profile.enums.ProfileGender;
import it.evodev.instagram.profile.exception.ProfileBadRequestException;
import it.evodev.instagram.profile.exception.ProfileNotFoundException;
import it.evodev.instagram.profile.model.ProfileEditProfile;
import it.evodev.instagram.profile.repository.ProfileEditProfileJpaRepository;
import it.evodev.instagram.profile.service.ProfileEditService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileEditServiceImpl implements ProfileEditService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileEditServiceImpl.class);

    private final ProfileEditProfileJpaRepository profileEditRepository;

    @Override
    public ProfileEditDataDTO editProfile(UUID currentUserId, ProfileEditRequestDTO request) {
        logger.info("Editing profile. Current user: {}", currentUserId);

        ProfileEditProfile profile = profileEditRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found for edit. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        if (request.isWebsiteUrlPresent()) {
            validateWebsite(request.getWebsiteUrl());
        }
        validateGender(request);

        if (request.isBioPresent()) {
            profile.setBio(normalizeOptionalText(request.getBio()));
        }

        if (request.isWebsiteUrlPresent()) {
            profile.setWebsiteUrl(normalizeOptionalText(request.getWebsiteUrl()));
        }

        if (request.isGenderPresent()) {
            String normalizedGender = normalizeOptionalText(request.getGender());
            profile.setGender(normalizedGender);
            if (ProfileGender.CUSTOM.getValue().equals(normalizedGender)) {
                profile.setCustomGender(normalizeOptionalText(request.getCustomGender()));
            } else {
                profile.setCustomGender(null);
            }
        } else if (request.isCustomGenderPresent()) {
            profile.setCustomGender(normalizeOptionalText(request.getCustomGender()));
        }

        ProfileEditProfile saved = profileEditRepository.save(profile);
        logger.info("Profile edited successfully. Profile ID: {}", saved.getId());

        return new ProfileEditDataDTO(saved.getBio(), saved.getWebsiteUrl(), saved.getGender(), saved.getCustomGender());
    }

    private void validateWebsite(String websiteUrl) {
        if (websiteUrl == null) {
            return;
        }

        String normalized = normalizeOptionalText(websiteUrl);
        if (normalized == null) {
            return;
        }

        try {
            URI parsed = URI.create(normalized);
            if (parsed.getScheme() == null || parsed.getHost() == null) {
                throw new IllegalArgumentException("Invalid URL");
            }
        } catch (Exception ex) {
            throw new ProfileBadRequestException("Invalid website URL");
        }
    }

    private void validateGender(ProfileEditRequestDTO request) {
        if (!request.isGenderPresent()) {
            return;
        }

        String normalizedGender = normalizeOptionalText(request.getGender());
        if (normalizedGender == null) {
            return;
        }

        if (ProfileGender.fromValue(normalizedGender).isEmpty()) {
            throw new ProfileBadRequestException("Invalid gender value");
        }

        if (ProfileGender.CUSTOM.getValue().equals(normalizedGender)
                && normalizeOptionalText(request.getCustomGender()) == null) {
            throw new ProfileBadRequestException("Custom gender is required when gender is custom");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
