package it.evodev.instagram.notifications.services;

import it.evodev.instagram.notifications.dto.NotificationDispatchRequestDTO;
import it.evodev.instagram.notifications.dto.NotificationListResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationMutationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationResponseDTO;
import it.evodev.instagram.notifications.dto.NotificationUnreadCountResponseDTO;

import java.util.UUID;

public interface NotificationService {
    NotificationListResponseDTO listForRecipient(UUID authSubjectUuid, Integer limit, String cursor);
    NotificationUnreadCountResponseDTO countUnread(UUID authSubjectUuid);
    NotificationMutationResponseDTO markAllAsRead(UUID authSubjectUuid);
    NotificationMutationResponseDTO markAsRead(UUID authSubjectUuid, UUID notificationUuid);
    NotificationMutationResponseDTO delete(UUID authSubjectUuid, UUID notificationUuid);
    NotificationResponseDTO dispatch(UUID authSubjectUuid, NotificationDispatchRequestDTO request);
}
