package it.evodev.instagram.auth.controllers;

import com.fatellicaterinasrl.fatellisync.auth.dto.LoginRequestDTO;
import com.fatellicaterinasrl.fatellisync.auth.dto.LoginResponseDTO;
import com.fatellicaterinasrl.fatellisync.auth.dto.RefreshRequestDTO;
import com.fatellicaterinasrl.fatellisync.auth.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class PublicAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDTO> refresh(@RequestBody @Valid RefreshRequestDTO request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }
}
