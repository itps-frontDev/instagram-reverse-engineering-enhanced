package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.config.JwtProperties;
import it.evodev.instagram.redis.RedisService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class AuthRedisService {

    private static final String PREFIX_REFRESH = "auth:refresh:";
    private static final String PREFIX_BLACKLIST = "auth:blacklist:";
    private static final String PREFIX_SESSIONS = "auth:sessions:";

    private final RedisService redisService;
    private final JwtProperties jwtProperties;

    public AuthRedisService(RedisService redisService, JwtProperties jwtProperties) {
        this.redisService = redisService;
        this.jwtProperties = jwtProperties;
    }

    public void storeRefreshToken(String refreshToken, Long userId, String email, String phoneNumber) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("email", email);
        payload.put("phoneNumber", phoneNumber);
        payload.put("createdAt", Instant.now().toString());

        redisService.saveOnRedis(PREFIX_REFRESH + refreshToken, payload, jwtProperties.getRefreshTokenTtl());
        addToUserSessions(userId, refreshToken);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getRefreshTokenData(String refreshToken) {
        return (Map<String, Object>) redisService.getFromRedis(PREFIX_REFRESH + refreshToken, Object.class);
    }

    public void revokeRefreshToken(String refreshToken) {
        Map<String, Object> data = getRefreshTokenData(refreshToken);
        if (data != null && data.get("userId") != null) {
            Long userId = ((Number) data.get("userId")).longValue();
            removeFromUserSessions(userId, refreshToken);
        }
        redisService.deleteFromRedis(PREFIX_REFRESH + refreshToken);
    }

    public void blacklistAccessToken(String jti, long remainingTtlSeconds) {
        if (remainingTtlSeconds > 0) {
            redisService.saveOnRedis(PREFIX_BLACKLIST + jti, "1", remainingTtlSeconds);
        }
    }

    public boolean isTokenBlacklisted(String jti) {
        return redisService.existsInRedis(PREFIX_BLACKLIST + jti);
    }

    public void revokeAllUserSessions(Long userId) {
        RedisTemplate<String, Object> template = redisService.getTemplate();
        String sessionsKey = PREFIX_SESSIONS + userId;
        Set<Object> tokens = template.opsForSet().members(sessionsKey);
        if (tokens != null) {
            for (Object token : tokens) {
                redisService.deleteFromRedis(PREFIX_REFRESH + token.toString());
            }
        }
        redisService.deleteFromRedis(sessionsKey);
    }

    private void addToUserSessions(Long userId, String refreshToken) {
        RedisTemplate<String, Object> template = redisService.getTemplate();
        String sessionsKey = PREFIX_SESSIONS + userId;
        template.opsForSet().add(sessionsKey, refreshToken);
        template.expire(sessionsKey, jwtProperties.getRefreshTokenTtl(), TimeUnit.SECONDS);
    }

    private void removeFromUserSessions(Long userId, String refreshToken) {
        RedisTemplate<String, Object> template = redisService.getTemplate();
        template.opsForSet().remove(PREFIX_SESSIONS + userId, refreshToken);
    }
}
