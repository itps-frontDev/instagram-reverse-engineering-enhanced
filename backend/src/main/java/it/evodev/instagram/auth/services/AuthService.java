package it.evodev.instagram.auth.services;

import com.fatellicaterinasrl.fatellisync.auth.config.JwtProperties;
import com.fatellicaterinasrl.fatellisync.auth.config.LockoutProperties;
import com.fatellicaterinasrl.fatellisync.auth.dto.LoginRequestDTO;
import com.fatellicaterinasrl.fatellisync.auth.dto.LoginResponseDTO;
import com.fatellicaterinasrl.fatellisync.auth.dto.UserInfoDTO;
import com.fatellicaterinasrl.fatellisync.auth.exceptions.AccountLockedException;
import com.fatellicaterinasrl.fatellisync.auth.exceptions.AuthException;
import com.fatellicaterinasrl.fatellisync.auth.exceptions.InvalidTokenException;
import com.fatellicaterinasrl.fatellisync.auth.models.User;
import com.fatellicaterinasrl.fatellisync.auth.repositories.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthRedisService authRedisService;
    private final JwtProperties jwtProperties;
    private final LockoutProperties lockoutProperties;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new AuthException("Account is disabled");
        }

        if (Boolean.TRUE.equals(user.getLocked())) {
            if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
                throw new AccountLockedException("Account is locked. Try again later");
            }
            // Lock expired — reset
            user.setLocked(false);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new AuthException("Invalid credentials");
        }

        handleSuccessfulLogin(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken();
        authRedisService.storeRefreshToken(refreshToken, user.getId(), user.getEmail(), user.getRole().name());

        return new LoginResponseDTO(accessToken, refreshToken, jwtProperties.getAccessTokenTtl(), "Bearer");
    }

    @Transactional
    public LoginResponseDTO refresh(String refreshToken) {
        Map<String, Object> data = authRedisService.getRefreshTokenData(refreshToken);
        if (data == null) {
            throw new InvalidTokenException("Refresh token is invalid or expired");
        }

        Long userId = ((Number) data.get("userId")).longValue();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        if (!Boolean.TRUE.equals(user.getEnabled()) || Boolean.TRUE.equals(user.getLocked())) {
            authRedisService.revokeRefreshToken(refreshToken);
            throw new AuthException("Account is not active");
        }

        // Rotate: revoke old, issue new
        authRedisService.revokeRefreshToken(refreshToken);

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken();
        authRedisService.storeRefreshToken(newRefreshToken, user.getId(), user.getEmail(), user.getRole().name());

        return new LoginResponseDTO(newAccessToken, newRefreshToken, jwtProperties.getAccessTokenTtl(), "Bearer");
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

    public UserInfoDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found"));
        return new UserInfoDTO(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole().name());
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= lockoutProperties.getMaxAttempts()) {
            user.setLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusSeconds(lockoutProperties.getLockoutDuration()));
        }
        userRepository.save(user);
    }

    private void handleSuccessfulLogin(User user) {
        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
