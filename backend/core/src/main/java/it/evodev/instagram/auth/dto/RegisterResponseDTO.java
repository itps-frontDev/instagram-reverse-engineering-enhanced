package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class RegisterResponseDTO {
    private String message;
    private UUID userId;
    private String username;
}
