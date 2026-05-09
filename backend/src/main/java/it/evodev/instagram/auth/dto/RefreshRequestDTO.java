package it.evodev.instagram.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshRequestDTO {
    @NotBlank
    private String refreshToken;
}
