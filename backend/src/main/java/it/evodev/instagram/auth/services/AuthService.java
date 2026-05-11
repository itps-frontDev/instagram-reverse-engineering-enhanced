package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.config.JwtProperties;
import it.evodev.instagram.auth.dto.LoginRequestDTO;
import it.evodev.instagram.auth.dto.LoginResponseDTO;
import it.evodev.instagram.auth.dto.UserInfoDTO;
import it.evodev.instagram.auth.exceptions.AuthException;
import it.evodev.instagram.auth.exceptions.InvalidTokenException;
import it.evodev.instagram.auth.models.User;
import it.evodev.instagram.auth.repositories.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRedisService authRedisService;
    private final JwtProperties jwtProperties;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
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

        return new LoginResponseDTO(accessToken, refreshToken, jwtProperties.getAccessTokenTtl(), jwtProperties.getRefreshTokenTtl(), "Bearer");
    }

    @Transactional
    public LoginResponseDTO refresh(String refreshToken) {
        Map<String, Object> data = authRedisService.getRefreshTokenData(refreshToken);
        if (data == null) {
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

        return new LoginResponseDTO(newAccessToken, newRefreshToken, jwtProperties.getAccessTokenTtl(), jwtProperties.getRefreshTokenTtl(), "Bearer");
    }

    public void logout(String accessToken, String refreshToken) {
        try {
            Claims claims = jwtService.parseAccessToken(accessToken);
            long remaining = jwtService.getRemainingTtlSeconds(claims);
            authRedisService.blacklistAccessToken(claims.getId(), remaining);
        } catch (JwtException ignored) {
            // Token already invalid — no need to blacklist
        }
        authRedisService.revokeRefreshToken(refreshToken);
    }

    public UserInfoDTO getCurrentUser(String subject) {
        UUID userId;
        try {
            userId = UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            throw new AuthException("User not found");
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        return new UserInfoDTO(user.getId(), user.getEmail(), user.getPhoneNumber());
    }
}
