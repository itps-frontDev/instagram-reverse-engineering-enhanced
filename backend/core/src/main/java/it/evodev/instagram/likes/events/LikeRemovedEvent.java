package it.evodev.instagram.likes.events;

import it.evodev.instagram.likes.models.enums.LikeableType;

public record LikeRemovedEvent(
        Long senderProfileId,
        Long recipientProfileId,
        LikeableType likeableType,
        Long likeableId
) {}
