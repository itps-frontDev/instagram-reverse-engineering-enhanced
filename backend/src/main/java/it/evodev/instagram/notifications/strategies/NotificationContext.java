package it.evodev.instagram.notifications.strategies;

import it.evodev.instagram.notifications.models.NotificationReferenceType;
import it.evodev.instagram.notifications.models.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationContext {
    private Long recipientProfileId;
    private Long senderProfileId;
    private NotificationType type;
    private NotificationReferenceType referenceType;
    private Long referenceId;
}
