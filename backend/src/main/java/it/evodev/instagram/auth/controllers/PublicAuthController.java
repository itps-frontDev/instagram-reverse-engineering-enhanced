package it.evodev.instagram.auth.controllers;

import it.evodev.instagram.auth.dto.LoginRequestDTO;
import it.evodev.instagram.auth.dto.LoginResponseDTO;
import it.evodev.instagram.auth.dto.RefreshRequestDTO;
import it.evodev.instagram.auth.dto.RegisterRequestDTO;
import it.evodev.instagram.auth.dto.RegisterResponseDTO;
import it.evodev.instagram.auth.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class PublicAuthController {

    private static final Logger logger = LoggerFactory.getLogger(PublicAuthController.class);

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
        logger.info("POST /api/public/auth/login - login request received");
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDTO> refresh(@RequestBody @Valid RefreshRequestDTO request) {
        logger.info("POST /api/public/auth/refresh - refresh request received");
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    /**
     * Usiamo POST su /register perché creiamo una nuova risorsa utente tramite payload completo.
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(@RequestBody @Valid RegisterRequestDTO request) {
        logger.info("POST /api/public/auth/register - register request received");
        RegisterResponseDTO response = authService.register(request);
        logger.info("POST /api/public/auth/register - register completed");
        return ResponseEntity.status(201).body(response);
    }
}
