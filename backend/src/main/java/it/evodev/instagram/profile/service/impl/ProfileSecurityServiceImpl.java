package it.evodev.instagram.profile.service.impl;

import it.evodev.instagram.auth.models.User;
import it.evodev.instagram.auth.repositories.UserRepository;
import it.evodev.instagram.profile.dto.request.ProfileSecurityUpdateRequestDTO;
import it.evodev.instagram.profile.dto.response.ProfileSecurityDataDTO;
import it.evodev.instagram.profile.exceptions.ProfileBadRequestException;
import it.evodev.instagram.profile.exceptions.ProfileConflictException;
import it.evodev.instagram.profile.exceptions.ProfileNotFoundException;
import it.evodev.instagram.profile.service.ProfileSecurityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileSecurityServiceImpl implements ProfileSecurityService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileSecurityServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ProfileSecurityDataDTO getSecurityData(UUID currentUserId) {
        logger.info("Fetching security data for user: {}", currentUserId);

        User user = userRepository.findByIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("User not found while fetching security data. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        logger.info("Security data fetched successfully for user: {}", currentUserId);
        return new ProfileSecurityDataDTO(user.getEmail(), user.getPhoneNumber());
    }

    @Override
    @Transactional
    public ProfileSecurityDataDTO updateSecurityData(UUID currentUserId, ProfileSecurityUpdateRequestDTO request) {
        logger.info("Updating security data for user: {}", currentUserId);

        User user = userRepository.findByIdAndDeletedAtIsNull(currentUserId)
                .orElseThrow(() -> {
                    logger.warn("User not found while updating security data. User ID: {}", currentUserId);
                    return new ProfileNotFoundException("Profile not found");
                });

        boolean contactUpdateRequested = request.isEmailPresent() || request.isPhoneNumberPresent();
        boolean passwordUpdateRequested = request.isCurrentPasswordPresent() || request.isNewPasswordPresent();
        if (!contactUpdateRequested && !passwordUpdateRequested) {
            logger.warn("Security update rejected: no updatable field provided. User ID: {}", currentUserId);
            throw new ProfileBadRequestException("At least one field is required");
        }

        if (request.isEmailPresent()) {
            String normalizedEmail = normalizeOptionalText(request.getEmail());
            if (normalizedEmail != null) {
                normalizedEmail = normalizedEmail.toLowerCase(Locale.ROOT);
                boolean emailTaken = userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(normalizedEmail, currentUserId);
                if (emailTaken) {
                    logger.warn("Security update rejected: email already in use. User ID: {}", currentUserId);
                    throw new ProfileConflictException("Email already in use");
                }
            }
            user.setEmail(normalizedEmail);
        }

        if (request.isPhoneNumberPresent()) {
            String normalizedPhone = normalizeOptionalText(request.getPhoneNumber());
            if (normalizedPhone != null) {
                boolean phoneTaken = userRepository.existsByPhoneNumberAndDeletedAtIsNullAndIdNot(normalizedPhone, currentUserId);
                if (phoneTaken) {
                    logger.warn("Security update rejected: phone number already in use. User ID: {}", currentUserId);
                    throw new ProfileConflictException("Phone number already in use");
                }
            }
            user.setPhoneNumber(normalizedPhone);
        }

        if (passwordUpdateRequested) {
            if (!request.isCurrentPasswordPresent() || !request.isNewPasswordPresent()) {
                logger.warn("Security update rejected: password pair is incomplete. User ID: {}", currentUserId);
                throw new ProfileBadRequestException("Both currentPassword and newPassword are required");
            }

            String currentPassword = request.getCurrentPassword();
            String newPassword = request.getNewPassword();
            if (currentPassword == null || currentPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
                logger.warn("Security update rejected: password values are blank. User ID: {}", currentUserId);
                throw new ProfileBadRequestException("Password values cannot be blank");
            }

            if (newPassword.equals(currentPassword)) {
                logger.warn("Security update rejected: new password equals current password. User ID: {}", currentUserId);
                throw new ProfileBadRequestException("New password must be different from current password");
            }

            if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                logger.warn("Security update rejected: current password mismatch. User ID: {}", currentUserId);
                throw new ProfileBadRequestException("Current password is incorrect");
            }

            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        User saved = userRepository.save(user);
        logger.info("Security data updated successfully for user: {}", currentUserId);
        return new ProfileSecurityDataDTO(saved.getEmail(), saved.getPhoneNumber());
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
