package it.evodev.instagram.media.dto;

import java.time.Instant;

public record MediaErrorDTO(String error, String message, Instant timestamp) {}
