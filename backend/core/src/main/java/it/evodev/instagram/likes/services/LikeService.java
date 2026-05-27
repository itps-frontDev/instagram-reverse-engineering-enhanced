package it.evodev.instagram.likes.services;

import it.evodev.instagram.likes.dto.responses.LikeToggleResponseDTO;
import it.evodev.instagram.likes.models.enums.LikeableType;

import java.util.UUID;

public interface LikeService {
    LikeToggleResponseDTO toggle(UUID authSubjectUuid, LikeableType type, Long likeableId);
}
