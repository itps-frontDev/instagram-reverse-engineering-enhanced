package it.evodev.instagram.auth.dto;

public record AuthMeResponseDto(
        Long id,
        String email,
        String phoneNumber,
        String username,
        String fullName
) {
}

