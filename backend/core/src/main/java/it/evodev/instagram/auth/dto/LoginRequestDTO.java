package it.evodev.instagram.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
    @NotBlank
    private String identifier;
    @NotBlank
    private String password;
}
