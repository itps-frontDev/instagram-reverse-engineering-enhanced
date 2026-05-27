package it.evodev.instagram.media.dto;

import java.time.LocalDateTime;

public record MediaErrorDTO(String error, String message, LocalDateTime timestamp) {}
