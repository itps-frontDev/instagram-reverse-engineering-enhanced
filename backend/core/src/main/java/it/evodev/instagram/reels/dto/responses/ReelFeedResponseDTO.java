package it.evodev.instagram.reels.dto.responses;

import java.util.List;

public record ReelFeedResponseDTO(
        List<ReelItemDTO> reels,
        boolean hasMore
) {}
