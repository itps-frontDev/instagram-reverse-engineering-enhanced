package it.evodev.instagram.auth.controllers;

import it.evodev.instagram.auth.dto.AuthMeResponseDto;
import it.evodev.instagram.auth.services.AuthFlowService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthFlowService authFlowService;

    @Value("${auth.cookies.access-token-name:iree_access_token}")
    private String accessTokenCookieName;

    @Value("${auth.cookies.refresh-token-name:iree_refresh_token}")
    private String refreshTokenCookieName;

    @Value("${auth.oauth2.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${auth.cookies.secure:false}")
    private boolean secureCookies;

    @GetMapping("/start")
    public ResponseEntity<Void> startAuthorization(
            @RequestParam(name = "redirect", required = false) String redirect,
            @RequestParam(name = "login_hint", required = false) String loginHint) {
        String authorizeUrl = authFlowService.buildAuthorizationUrl(redirect, loginHint);
        return ResponseEntity.status(302).location(URI.create(authorizeUrl)).build();
    }

    @GetMapping("/callback")
    public RedirectView callback(
            @RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "error", required = false) String error,
            HttpServletResponse response) {
        if (error != null || code == null || state == null) {
            return new RedirectView(frontendBaseUrl + "/login?error=oauth_failed");
        }

        try {
            AuthFlowService.CallbackResult callbackResult = authFlowService.handleCallback(code, state);
            response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(accessTokenCookieName, callbackResult.accessToken(), callbackResult.accessTokenExpiresIn()));
            response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(refreshTokenCookieName, callbackResult.refreshToken(), Duration.ofDays(30).toSeconds()));
            return new RedirectView(callbackResult.frontendRedirectUri());
        } catch (RuntimeException ex) {
            return new RedirectView(frontendBaseUrl + "/login?error=oauth_failed");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = "iree_access_token", required = false) String accessToken,
            @CookieValue(name = "iree_refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {
        authFlowService.revokeToken(accessToken);
        authFlowService.revokeToken(refreshToken);

        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(accessTokenCookieName));
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie(refreshTokenCookieName));

        return ResponseEntity.ok(Map.of("message", "Logout completato con successo"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @CookieValue(name = "iree_access_token", required = false) String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Non autorizzato"));
        }

        try {
            Optional<AuthMeResponseDto> user = authFlowService.resolveCurrentUser(accessToken);
            if (user.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Non autorizzato"));
            }
            return ResponseEntity.ok(Map.of("user", user.get()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(401).body(Map.of("error", "Non autorizzato"));
        }
    }

    private String buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build()
                .toString();
    }

    private String clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build()
                .toString();
    }
}

