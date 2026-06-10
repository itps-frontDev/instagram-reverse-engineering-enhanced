package it.evodev.instagram.profile.picture.dto;

import java.time.Instant;

public record ProfilePictureErrorDTO(String error, String message, Instant timestamp) {}
