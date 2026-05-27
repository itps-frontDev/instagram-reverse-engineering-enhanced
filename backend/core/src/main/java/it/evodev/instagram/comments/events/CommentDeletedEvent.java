package it.evodev.instagram.comments.events;

public record CommentDeletedEvent(
        Long commentId,
        Long senderProfileId,
        Long recipientProfileId,
        Long parentId
) {}
