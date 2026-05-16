package it.evodev.instagram.likes.controllers;

import it.evodev.instagram.likes.dto.responses.LikeToggleResponseDTO;
import it.evodev.instagram.likes.models.enums.LikeableType;
import it.evodev.instagram.likes.services.LikeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/priv/likes")
@RequiredArgsConstructor
public class LikesController {

    private static final Logger logger = LoggerFactory.getLogger(LikesController.class);

    private final LikeService likeService;

    @PostMapping("/{likeableType}/{likeableId}")
    public ResponseEntity<LikeToggleResponseDTO> toggle(
            @PathVariable LikeableType likeableType,
            @PathVariable Long likeableId,
            Authentication authentication
    ) {
        logger.info("POST /api/priv/likes/{}/{} - toggle request received", likeableType, likeableId);
        LikeToggleResponseDTO response = likeService.toggle(
                UUID.fromString(authentication.getName()),
                likeableType,
                likeableId
        );
        return ResponseEntity.ok(response);
    }
}
