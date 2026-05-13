package it.evodev.instagram.notifications.models.commands;

public record NotificationDispatchCommand(
        Long recipientProfileId,
        Long senderProfileId,
        String type,
        String referenceType,
        Long referenceId
) {}
