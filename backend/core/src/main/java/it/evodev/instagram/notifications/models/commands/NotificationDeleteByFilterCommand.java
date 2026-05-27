package it.evodev.instagram.notifications.models.commands;

import java.util.List;

public record NotificationDeleteByFilterCommand(
        Long recipientProfileId,
        Long senderProfileId,
        String type,
        List<String> types,
        String referenceType,
        Long referenceId
) {}
