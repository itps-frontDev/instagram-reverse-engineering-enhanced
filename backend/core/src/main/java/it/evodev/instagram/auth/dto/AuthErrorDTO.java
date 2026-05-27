package it.evodev.instagram.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AuthErrorDTO {
    private String error;
    private String message;
    private LocalDateTime timestamp;
}
