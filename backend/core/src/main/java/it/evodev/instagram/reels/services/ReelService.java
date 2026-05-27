package it.evodev.instagram.reels.services;

import it.evodev.instagram.reels.dto.responses.ReelFeedResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ReelService {

    ReelFeedResponseDTO getReels(UUID userId, int limit, List<Long> excludeIds);
}
