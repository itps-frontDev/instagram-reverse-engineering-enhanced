package it.evodev.instagram.follow.controllers;

import it.evodev.instagram.follow.dto.responses.FollowResponseDTO;
import it.evodev.instagram.follow.dto.responses.FollowerDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowMutationResponseDTO;
import it.evodev.instagram.follow.dto.responses.FollowStatusDataDTO;
import it.evodev.instagram.follow.dto.responses.FollowToggleResponseDTO;
import it.evodev.instagram.follow.dto.responses.SuggestionDTO;
import it.evodev.instagram.follow.services.FollowService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/priv/follows")
@RequiredArgsConstructor
public class FollowController {

    private static final Logger logger = LoggerFactory.getLogger(FollowController.class);

    private final FollowService followService;

    @GetMapping("/{username}/status")
    public ResponseEntity<FollowResponseDTO<FollowStatusDataDTO>> getFollowStatus(
            @PathVariable String username,
            Authentication authentication) {
        logger.info("GET /api/priv/follows/{}/status - user: {}", username, authentication.getName());
        FollowStatusDataDTO result = followService.getFollowStatus(uuid(authentication), username);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Follow status evaluated successfully"));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<FollowResponseDTO<List<FollowerDataDTO>>> getFollowers(
            @PathVariable String username,
            Authentication authentication) {
        logger.info("GET /api/priv/follows/{}/followers - user: {}", username, authentication.getName());
        List<FollowerDataDTO> result = followService.getFollowers(uuid(authentication), username);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Followers fetched successfully"));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<FollowResponseDTO<List<FollowerDataDTO>>> getFollowing(
            @PathVariable String username,
            Authentication authentication) {
        logger.info("GET /api/priv/follows/{}/following - user: {}", username, authentication.getName());
        List<FollowerDataDTO> result = followService.getFollowing(uuid(authentication), username);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Following fetched successfully"));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<FollowResponseDTO<List<SuggestionDTO>>> getSuggestions(
            Authentication authentication) {
        logger.info("GET /api/priv/follows/suggestions - user: {}", authentication.getName());
        List<SuggestionDTO> result = followService.getSuggestions(uuid(authentication));
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Suggestions fetched successfully"));
    }

    @PostMapping("/{targetProfileId}")
    public ResponseEntity<FollowResponseDTO<FollowToggleResponseDTO>> toggle(
            @PathVariable Long targetProfileId,
            Authentication authentication) {
        logger.info("POST /api/priv/follows/{} - user: {}", targetProfileId, authentication.getName());
        FollowToggleResponseDTO result = followService.toggle(uuid(authentication), targetProfileId);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Follow toggled successfully"));
    }

    @PostMapping("/requests/{requesterProfileId}/accept")
    public ResponseEntity<FollowResponseDTO<FollowMutationResponseDTO>> accept(
            @PathVariable Long requesterProfileId,
            Authentication authentication) {
        logger.info("POST /api/priv/follows/requests/{}/accept - user: {}", requesterProfileId, authentication.getName());
        FollowMutationResponseDTO result = followService.accept(uuid(authentication), requesterProfileId);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Follow request accepted"));
    }

    @PostMapping("/requests/{requesterProfileId}/reject")
    public ResponseEntity<FollowResponseDTO<FollowMutationResponseDTO>> reject(
            @PathVariable Long requesterProfileId,
            Authentication authentication) {
        logger.info("POST /api/priv/follows/requests/{}/reject - user: {}", requesterProfileId, authentication.getName());
        FollowMutationResponseDTO result = followService.reject(uuid(authentication), requesterProfileId);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Follow request rejected"));
    }

    @DeleteMapping("/followers/{followerProfileId}")
    public ResponseEntity<FollowResponseDTO<FollowMutationResponseDTO>> removeFollower(
            @PathVariable Long followerProfileId,
            Authentication authentication) {
        logger.info("DELETE /api/priv/follows/followers/{} - user: {}", followerProfileId, authentication.getName());
        FollowMutationResponseDTO result = followService.removeFollower(uuid(authentication), followerProfileId);
        return ResponseEntity.ok(FollowResponseDTO.success(result, "Follower removed successfully"));
    }

    private UUID uuid(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
