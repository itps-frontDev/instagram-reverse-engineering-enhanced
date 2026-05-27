package it.evodev.instagram.comments.events;

public record CommentCreatedEvent(
        Long commentId,
        Long senderProfileId,
        Long recipientProfileId,
        Long parentId
) {}
