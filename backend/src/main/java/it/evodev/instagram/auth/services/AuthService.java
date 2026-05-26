package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.config.JwtProperties;
import it.evodev.instagram.auth.dto.LoginRequestDTO;
import it.evodev.instagram.auth.dto.LoginResponseDTO;
import it.evodev.instagram.auth.dto.RegisterBirthDateDTO;
import it.evodev.instagram.auth.dto.RegisterRequestDTO;
import it.evodev.instagram.auth.dto.RegisterResponseDTO;
import it.evodev.instagram.auth.dto.UserInfoDTO;
import it.evodev.instagram.auth.exceptions.AuthException;
import it.evodev.instagram.auth.exceptions.EmailAlreadyExistsException;
import it.evodev.instagram.auth.exceptions.InvalidTokenException;
import it.evodev.instagram.auth.exceptions.UsernameAlreadyExistsException;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.auth.models.User;
import it.evodev.instagram.auth.repositories.ProfileRepository;
import it.evodev.instagram.auth.repositories.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRedisService authRedisService;
    private final JwtProperties jwtProperties;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        logger.info("Login started");
        String normalizedIdentifier = request.getIdentifier().trim().toLowerCase();
        User user = userRepository.findByLoginIdentifier(normalizedIdentifier)
                .orElseThrow(() -> new AuthException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Invalid credentials");
        }
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();
        authRedisService.storeRefreshToken(refreshToken, user.getId(), user.getEmail(), user.getPhoneNumber());
        logger.info("Login completed");
        return new LoginResponseDTO(accessToken, refreshToken, jwtProperties.getAccessTokenTtl(), jwtProperties.getRefreshTokenTtl(), "Bearer");
    }

    @Transactional
    public LoginResponseDTO refresh(String refreshToken) {
        logger.info("Refresh started");
        Map<String, Object> data = authRedisService.getRefreshTokenData(refreshToken);
        if (data == null) {
            logger.warn("Refresh token not found");
            throw new InvalidTokenException("Refresh token is invalid or expired");
        }

        UUID userId = UUID.fromString(String.valueOf(data.get("userId")));
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        // Rotate: revoke old, issue new
        authRedisService.revokeRefreshToken(refreshToken);

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken();
        authRedisService.storeRefreshToken(newRefreshToken, user.getId(), user.getEmail(), user.getPhoneNumber());
        logger.info("Refresh completed");
        return new LoginResponseDTO(newAccessToken, newRefreshToken, jwtProperties.getAccessTokenTtl(), jwtProperties.getRefreshTokenTtl(), "Bearer");
    }

    @Transactional
    public RegisterResponseDTO register(RegisterRequestDTO request) {
        logger.info("Register started");
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedUsername = request.getUsername().trim().toLowerCase();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            logger.warn("Register conflict on email");
            throw new EmailAlreadyExistsException("Email already registered");
        }

        if (profileRepository.findByUsernameIgnoreCaseAndDeletedAtIsNull(normalizedUsername).isPresent()) {
            logger.warn("Register conflict on username");
            throw new UsernameAlreadyExistsException("Username already exists");
        }

        LocalDate dateOfBirth = parseDateOfBirth(request.getBirthDate());
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        try {
            User user = new User();
            user.setEmail(normalizedEmail);
            user.setPasswordHash(hashedPassword);
            user.setDateOfBirth(dateOfBirth);
            user.setIsEmailVerified(Boolean.FALSE);
            user.setIsPhoneVerified(Boolean.FALSE);
            User savedUser = userRepository.saveAndFlush(user);

            Profile profile = new Profile();
            profile.setUserId(savedUser.getId());
            profile.setUsername(normalizedUsername);
            profile.setFullName(normalizeFullName(request.getFullName()));
            profileRepository.save(profile);

            logger.info("Register completed");
            return new RegisterResponseDTO("Registration completed successfully", savedUser.getId(), normalizedUsername);
        } catch (DataIntegrityViolationException e) {
            logger.error("Register failed due to integrity violation: {}", e.getMessage());
            String message = String.valueOf(e.getMessage()).toLowerCase();
            if (message.contains("email")) {
                throw new EmailAlreadyExistsException("Email already registered");
            }
            if (message.contains("username")) {
                throw new UsernameAlreadyExistsException("Username already exists");
            }
            throw new AuthException("Registration failed");
        }
    }

    public void logout(String accessToken, String refreshToken) {
        logger.info("Logout started");
        try {
            Claims claims = jwtService.parseAccessToken(accessToken);
            long remaining = jwtService.getRemainingTtlSeconds(claims);
            authRedisService.blacklistAccessToken(claims.getId(), remaining);
        } catch (JwtException ignored) {
            // Token already invalid — no need to blacklist
        }
        authRedisService.revokeRefreshToken(refreshToken);
        logger.info("Logout completed");
    }

    public UserInfoDTO getCurrentUser(String subject) {
        logger.info("Get current user started");
        UUID userId;
        try {
            userId = UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            logger.warn("Get current user failed: invalid subject");
            throw new AuthException("User not found");
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        Profile profile = profileRepository.findByUserIdAndDeletedAtIsNull(user.getId()).orElse(null);
        logger.info("Get current user completed");
        return new UserInfoDTO(
                user.getId(),
                user.getEmail(),
                user.getPhoneNumber(),
                profile != null ? profile.getUsername() : null,
                profile != null ? profile.getFullName() : null
        );
    }

    private static String normalizeFullName(String fullName) {
        if (fullName == null) {
            return "";
        }
        return fullName.trim();
    }

    private static LocalDate parseDateOfBirth(RegisterBirthDateDTO birthDate) {
        if (birthDate == null) {
            return LocalDate.of(2000, 1, 1);
        }

        try {
            int year = Integer.parseInt(birthDate.getYear());
            int month = Integer.parseInt(birthDate.getMonth());
            int day = Integer.parseInt(birthDate.getDay());
            return LocalDate.of(year, month, day);
        } catch (RuntimeException ex) {
            throw new AuthException("Invalid birth date");
        }
    }
}
