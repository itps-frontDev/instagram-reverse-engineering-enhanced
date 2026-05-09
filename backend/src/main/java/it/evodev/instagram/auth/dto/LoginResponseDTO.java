package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
}
