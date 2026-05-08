package it.evodev.instagram.auth.services;

import it.evodev.instagram.auth.dto.AuthMeResponseDto;
import it.evodev.instagram.auth.models.ProfileModel;
import it.evodev.instagram.auth.models.UserModel;
import it.evodev.instagram.auth.repositories.ProfileAuthRepository;
import it.evodev.instagram.auth.repositories.UserAuthRepository;
import it.evodev.instagram.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthFlowService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String STATE_KEY_PREFIX = "oauth:state:";

    private final RedisService redisService;
    private final JwtDecoder jwtDecoder;
    private final UserAuthRepository userAuthRepository;
    private final ProfileAuthRepository profileAuthRepository;
    private final RestClient.Builder restClientBuilder;

    @Value("${auth.oauth2.client-id:frontend-web}")
    private String clientId;

    @Value("${auth.oauth2.client-secret:frontend-web-secret}")
    private String clientSecret;

    @Value("${auth.oauth2.redirect-uri:http://localhost:8080/api/v1/auth/callback}")
    private String redirectUri;

    @Value("${auth.oauth2.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${auth.oauth2.scope:openid profile}")
    private String scope;

    @Value("${auth.oauth2.server-base-url:http://localhost:8080}")
    private String serverBaseUrl;

    @Value("${auth.oauth2.state-ttl-seconds:300}")
    private long stateTtlSeconds;

    public String buildAuthorizationUrl(String redirectPath, String loginHint) {
        String safeRedirectPath = normalizeRedirectPath(redirectPath);
        String state = generateState();

        redisService.saveOnRedis(STATE_KEY_PREFIX + state, safeRedirectPath, stateTtlSeconds);

        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(serverBaseUrl + "/oauth2/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("scope", scope)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", state);

        if (loginHint != null && !loginHint.isBlank()) {
            uriBuilder.queryParam("login_hint", loginHint.trim());
        }

        return uriBuilder.build(true).toUriString();
    }

    public CallbackResult handleCallback(String code, String state) {
        String stateKey = STATE_KEY_PREFIX + state;
        String redirectPath = redisService.getFromRedis(stateKey, String.class);
        if (redirectPath == null || redirectPath.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired OAuth state");
        }

        redisService.deleteFromRedis(stateKey);

        TokenResult tokenResult = exchangeAuthorizationCode(code);
        String frontendRedirect = frontendBaseUrl + normalizeRedirectPath(redirectPath);

        return new CallbackResult(frontendRedirect, tokenResult.accessToken(), tokenResult.refreshToken(), tokenResult.expiresIn());
    }

    public Optional<AuthMeResponseDto> resolveCurrentUser(String accessToken) {
        Jwt jwt = jwtDecoder.decode(accessToken);
        Long userId = extractUserId(jwt);

        UserModel user = userAuthRepository.findByIdAndDeletedAtIsNull(userId).orElse(null);
        if (user == null) {
            return Optional.empty();
        }

        ProfileModel profile = profileAuthRepository.findByUser_IdAndDeletedAtIsNull(userId).orElse(null);
        return Optional.of(new AuthMeResponseDto(
                user.getId(),
                user.getEmail(),
                user.getPhoneNumber(),
                profile != null ? profile.getUsername() : null,
                profile != null ? profile.getFullName() : null
        ));
    }

    public void revokeToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("token", token);
        payload.add("client_id", clientId);
        payload.add("client_secret", clientSecret);

        restClientBuilder.build()
                .post()
                .uri(serverBaseUrl + "/oauth2/revoke")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    private TokenResult exchangeAuthorizationCode(String code) {
        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("grant_type", "authorization_code");
        payload.add("code", code);
        payload.add("redirect_uri", redirectUri);
        payload.add("client_id", clientId);
        payload.add("client_secret", clientSecret);

        Map<?, ?> body = restClientBuilder.build()
                .post()
                .uri(serverBaseUrl + "/oauth2/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(payload)
                .retrieve()
                .body(Map.class);

        if (body == null || body.get("access_token") == null) {
            throw new IllegalStateException("OAuth token response is missing access_token");
        }

        String accessToken = String.valueOf(body.get("access_token"));
        String refreshToken = body.get("refresh_token") != null ? String.valueOf(body.get("refresh_token")) : "";
        long expiresIn = body.get("expires_in") != null ? Long.parseLong(String.valueOf(body.get("expires_in"))) : 900L;

        return new TokenResult(accessToken, refreshToken, expiresIn);
    }

    private String normalizeRedirectPath(String redirectPath) {
        if (redirectPath == null || redirectPath.isBlank()) {
            return "/";
        }
        if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
            return "/";
        }
        return redirectPath;
    }

    private Long extractUserId(Jwt jwt) {
        Object uidClaim = jwt.getClaims().get("uid");
        if (uidClaim instanceof Number number) {
            return number.longValue();
        }

        String subject = jwt.getSubject();
        if (subject != null && subject.matches("^\\d+$")) {
            return Long.parseLong(subject);
        }

        throw new IllegalStateException("Token does not contain a valid user id");
    }

    private String generateState() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public record CallbackResult(
            String frontendRedirectUri,
            String accessToken,
            String refreshToken,
            long accessTokenExpiresIn
    ) {
    }

    private record TokenResult(String accessToken, String refreshToken, long expiresIn) {
    }
}

