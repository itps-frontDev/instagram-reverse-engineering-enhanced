package it.evodev.instagram.notifications.services;

import it.evodev.instagram.notifications.dto.responses.NotificationListResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationMutationResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationResponseDTO;
import it.evodev.instagram.notifications.dto.responses.NotificationUnreadCountResponseDTO;
import it.evodev.instagram.notifications.models.commands.NotificationDeleteByFilterCommand;
import it.evodev.instagram.notifications.models.commands.NotificationDispatchCommand;

import java.util.UUID;

public interface NotificationService {
    NotificationListResponseDTO listForRecipient(UUID authSubjectUuid, Integer limit, String cursor);
    NotificationUnreadCountResponseDTO countUnread(UUID authSubjectUuid);
    NotificationMutationResponseDTO markAllAsRead(UUID authSubjectUuid);
    NotificationMutationResponseDTO markAsRead(UUID authSubjectUuid, UUID notificationUuid);
    NotificationMutationResponseDTO delete(UUID authSubjectUuid, UUID notificationUuid);
    NotificationMutationResponseDTO promoteFollowRequest(UUID authSubjectUuid, Long recipientProfileId, Long followerProfileId);
    void dispatchInternal(NotificationDispatchCommand command);
    void deleteByFilterInternal(NotificationDeleteByFilterCommand command);
}
