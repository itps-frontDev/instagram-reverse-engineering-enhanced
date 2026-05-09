package it.evodev.instagram.auth.controllers;

import it.evodev.instagram.auth.dto.RefreshRequestDTO;
import it.evodev.instagram.auth.dto.UserInfoDTO;
import it.evodev.instagram.auth.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/priv/auth")
@RequiredArgsConstructor
public class PrivateAuthController {

    private final AuthService authService;

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader,
                                       @RequestBody @Valid RefreshRequestDTO request) {
        authService.logout(authHeader.substring(7), request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoDTO> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
