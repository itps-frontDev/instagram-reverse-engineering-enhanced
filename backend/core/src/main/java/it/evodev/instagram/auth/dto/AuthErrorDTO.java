package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class AuthErrorDTO {
    private String error;
    private String message;
    private Instant timestamp;
}
