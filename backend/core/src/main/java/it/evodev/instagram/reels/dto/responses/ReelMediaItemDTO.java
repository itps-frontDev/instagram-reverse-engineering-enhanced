package it.evodev.instagram.reels.dto.responses;

public record ReelMediaItemDTO(
        Long id,
        String mediaUrl,
        String mediaType,
        Double durationSeconds,
        Integer position
) {}
