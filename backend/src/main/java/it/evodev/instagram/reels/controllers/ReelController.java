package it.evodev.instagram.reels.controllers;

import it.evodev.instagram.reels.dto.responses.ReelApiResponse;
import it.evodev.instagram.reels.dto.responses.ReelFeedResponseDTO;
import it.evodev.instagram.reels.services.ReelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/reels")
@RequiredArgsConstructor
public class ReelController {

    private final ReelService reelService;

    @GetMapping
    public ResponseEntity<ReelApiResponse<ReelFeedResponseDTO>> getReels(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false, defaultValue = "") List<Long> excludeIds,
            Authentication authentication
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        List<Long> ids = excludeIds == null ? Collections.emptyList() : excludeIds;
        ReelFeedResponseDTO data = reelService.getReels(userId, limit, ids);
        return ResponseEntity.ok(ReelApiResponse.success(data));
    }
}
