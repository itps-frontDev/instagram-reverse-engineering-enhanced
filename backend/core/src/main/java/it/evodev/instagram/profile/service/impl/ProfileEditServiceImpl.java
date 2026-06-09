package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.profile.dto.request.ProfileEditRequestDTO;
import it.evodev.instagram.profile.dto.request.ProfilePrivacyRequestDTO;
import it.evodev.instagram.profile.dto.request.ProfilePersonalRequestDTO;
import it.evodev.instagram.profile.dto.request.UpdateBirthdayRequestDTO;
import it.evodev.instagram.profile.dto.response.BirthdayDataDTO;
import it.evodev.instagram.profile.dto.response.ProfileEditDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePrivacyDataDTO;
import it.evodev.instagram.profile.dto.response.ProfilePersonalDataDTO;
import it.evodev.instagram.profile.models.enums.ProfileGender;
import it.evodev.instagram.profile.exceptions.InvalidAgeException;
import it.evodev.instagram.profile.exceptions.ProfileBadRequestException;
import it.evodev.instagram.profile.exceptions.ProfileConflictException;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.ProfileEditJpaRepository;
import it.evodev.instagram.profile.service.ProfileEditService;
import it.evodev.instagram.auth.models.User;
import it.evodev.instagram.auth.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileEditServiceImpl implements ProfileEditService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileEditServiceImpl.class);
    private static final int MIN_AGE = 13;

    private final ProfileEditJpaRepository profileEditRepository;
    private final UserRepository userRepository;

    @Override
    public ProfileEditDataDTO editProfile(UUID currentUserId, ProfileEditRequestDTO request) {
        logger.info("Editing profile. Current user: {}", currentUserId);

        Profile profile = profileEditRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
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

        Profile saved = profileEditRepository.save(profile);
        logger.info("Profile edited successfully. Profile ID: {}", saved.getId());

        return new ProfileEditDataDTO(saved.getBio(), saved.getWebsiteUrl(), saved.getGender(), saved.getCustomGender());
    }

    @Override
    public ProfilePersonalDataDTO updatePersonalInfo(UUID currentUserId, ProfilePersonalRequestDTO request) {
        logger.info("Updating personal profile info. Current user: {}", currentUserId);

        Profile currentProfile = profileEditRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found for personal update. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        String normalizedUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);
        String normalizedCurrentUsername = currentProfile.getUsername().trim().toLowerCase(Locale.ROOT);

        if (!normalizedUsername.equals(normalizedCurrentUsername)) {
            boolean usernameTaken = profileEditRepository.existsByUsernameIgnoreCaseAndDeletedAtIsNullAndIdNot(
                    normalizedUsername,
                    currentProfile.getId()
            );

            if (usernameTaken) {
                logger.warn("Username already in use. Requested username: {}, Current profile ID: {}",
                        normalizedUsername,
                        currentProfile.getId());
                throw new ProfileConflictException("Username already in use");
            }
        }

        currentProfile.setUsername(normalizedUsername);
        currentProfile.setFullName(normalizeOptionalText(request.getFullName()));

        Profile saved = profileEditRepository.save(currentProfile);

        logger.info("Personal profile info updated successfully. Profile ID: {}", saved.getId());

        return new ProfilePersonalDataDTO(saved.getUsername(), saved.getFullName());
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

    @Override
    public BirthdayDataDTO updateBirthday(UUID currentUserId, UpdateBirthdayRequestDTO request) {
        logger.info("Updating birthday for user: {} with date: {}", currentUserId, request.getBirthday());

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("User not found for birthday update. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        LocalDate birthday = request.getBirthday();

        // Validazione età minima (13 anni)
        int age = calculateAge(birthday, LocalDate.now());

        if (age < MIN_AGE) {
            logger.warn("Birthday update rejected: user age {} < {} for user: {}", age, MIN_AGE, currentUserId);
            throw new InvalidAgeException("User must be at least " + MIN_AGE + " years old");
        }

        // Aggiorna la data di nascita
        user.setDateOfBirth(birthday);

        // Salva l'entità User
        User saved = userRepository.save(user);

        logger.info("Birthday updated successfully for user: {} to: {}", currentUserId, birthday);
        return new BirthdayDataDTO(saved.getDateOfBirth());
    }

    @Override
    @Transactional
    public ProfilePrivacyDataDTO updatePrivacy(UUID currentUserId, ProfilePrivacyRequestDTO request) {
        logger.info("Updating privacy for user: {} with requested isPrivate: {}", currentUserId, request.getIsPrivate());

        Profile currentProfile = profileEditRepository.findByUserIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("Current user profile not found for privacy update. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        boolean currentPrivacy = Boolean.TRUE.equals(currentProfile.getIsPrivate());
        boolean requestedPrivacy = Boolean.TRUE.equals(request.getIsPrivate());
        if (currentPrivacy == requestedPrivacy) {
            logger.info("Privacy unchanged for user: {}. isPrivate remains: {}", currentUserId, currentPrivacy);
            return new ProfilePrivacyDataDTO(currentPrivacy, 0);
        }

        int promotedFollowsCount = 0;
        if (!requestedPrivacy) {
            int pendingBeforePromotion = profileEditRepository.countPendingFollowRequests(currentProfile.getId());
            if (pendingBeforePromotion > 0) {
                int followingRowsUpdated = profileEditRepository.incrementFollowingCountForFollowersOfPendingRequests(currentProfile.getId());
                promotedFollowsCount = profileEditRepository.promotePendingFollowRequestsToAccepted(currentProfile.getId());
                int followerRowsUpdated = profileEditRepository.incrementFollowersCountById(currentProfile.getId(), promotedFollowsCount);

                logger.info("Bulk promotion completed. profileId: {} - promotedFollowsCount: {} - followersRowsUpdated: {} - followingRowsUpdated: {}",
                        currentProfile.getId(),
                        promotedFollowsCount,
                        followerRowsUpdated,
                        followingRowsUpdated);
            }
        }

        currentProfile.setIsPrivate(requestedPrivacy);
        profileEditRepository.save(currentProfile);

        logger.info("Privacy update committed for user: {}. isPrivate: {} - promotedFollowsCount: {}",
                currentUserId,
                requestedPrivacy,
                promotedFollowsCount);
        return new ProfilePrivacyDataDTO(requestedPrivacy, promotedFollowsCount);
    }

    /**
     * Calcola l'età in base alla data di nascita e la data odierna.
     * 
     * @param birthDate data di nascita
     * @param today data di riferimento (solitamente LocalDate.now())
     * @return età in anni
     */
    private int calculateAge(LocalDate birthDate, LocalDate today) {
        int age = today.getYear() - birthDate.getYear();
        
        // Se il compleanno non è ancora passato quest'anno, sottrai 1
        if (today.getMonthValue() < birthDate.getMonthValue() ||
            (today.getMonthValue() == birthDate.getMonthValue() && today.getDayOfMonth() < birthDate.getDayOfMonth())) {
            age--;
        }
        
        return age;
    }
}
