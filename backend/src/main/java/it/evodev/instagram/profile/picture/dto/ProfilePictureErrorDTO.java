package it.evodev.instagram.profile.picture.dto;

import java.time.LocalDateTime;

public record ProfilePictureErrorDTO(String error, String message, LocalDateTime timestamp) {}
