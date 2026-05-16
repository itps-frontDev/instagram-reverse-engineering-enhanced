package it.evodev.instagram.likes.dto.responses;

public record LikeToggleResponseDTO(
        boolean success,
        boolean liked,
        long count
) {}
